import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import { notification } from 'antd';
import SeededRandom from '../utils/randomGenerator';

// Rangos para el bingo español (formato reglamentario)
const SPANISH_BINGO_COLUMNS = [
  { min: 1, max: 9 },    // Columna 1: 1-9
  { min: 10, max: 19 },  // Columna 2: 10-19
  { min: 20, max: 29 },  // Columna 3: 20-29
  { min: 30, max: 39 },  // Columna 4: 30-39
  { min: 40, max: 49 },  // Columna 5: 40-49
  { min: 50, max: 59 },  // Columna 6: 50-59
  { min: 60, max: 69 },  // Columna 7: 60-69
  { min: 70, max: 79 },  // Columna 8: 70-79
  { min: 80, max: 90 }   // Columna 9: 80-90
];

// Crear el contexto
const BingoContext = createContext();

// Generar un cartón de bingo en formato español (3x9) usando un generador aleatorio con semilla
const generateSpanishBingoCard = (randomGenerator) => {
  // Matriz 3x9 con todos los valores inicialmente nulos
  const card = Array(3).fill().map(() => Array(9).fill(null));
  
  // Para cada columna, debemos tener 1 o 2 números (nunca 3)
  for (let col = 0; col < 9; col++) {
    const { min, max } = SPANISH_BINGO_COLUMNS[col];
    
    // Decidir cuántos números tendrá esta columna (1 o 2)
    // Necesitamos 15 números en total para 9 columnas, así que
    // algunas columnas tendrán 1 número y otras tendrán 2
    const numbersInColumn = col < 6 ? 2 : 1; // 6 columnas con 2 números y 3 con 1 número = 15
    
    // Determinar aleatoriamente qué filas tendrán números
    const rows = [0, 1, 2];
    const selectedRows = [];
    
    for (let i = 0; i < numbersInColumn; i++) {
      const randomIndex = Math.floor(randomGenerator.next() * rows.length);
      selectedRows.push(rows[randomIndex]);
      rows.splice(randomIndex, 1);
    }
    
    // Generar los números para las filas seleccionadas
    const usedNumbers = [];
    
    selectedRows.forEach(row => {
      const num = randomGenerator.nextIntExcluding(min, max, usedNumbers);
      usedNumbers.push(num);
      card[row][col] = num;
    });
  }
  
  // Asegurarnos de que cada fila tenga exactamente 5 números
  for (let row = 0; row < 3; row++) {
    const nonNullCells = card[row].filter(cell => cell !== null).length;
    
    // Si la fila tiene más de 5 números, eliminar algunos al azar
    if (nonNullCells > 5) {
      const indices = card[row]
        .map((val, idx) => ({ val, idx }))
        .filter(item => item.val !== null)
        .map(item => item.idx);
      
      const toRemove = nonNullCells - 5;
      
      for (let i = 0; i < toRemove; i++) {
        const randomIdx = Math.floor(randomGenerator.next() * indices.length);
        const colToRemove = indices[randomIdx];
        card[row][colToRemove] = null;
        indices.splice(randomIdx, 1);
      }
    }
    
    // Si la fila tiene menos de 5 números, añadir algunos al azar
    else if (nonNullCells < 5) {
      const nullIndices = card[row]
        .map((val, idx) => ({ val, idx }))
        .filter(item => item.val === null)
        .map(item => item.idx);
      
      const toAdd = 5 - nonNullCells;
      
      for (let i = 0; i < toAdd; i++) {
        const randomIdx = Math.floor(randomGenerator.next() * nullIndices.length);
        const colToAdd = nullIndices[randomIdx];
        const { min, max } = SPANISH_BINGO_COLUMNS[colToAdd];
        
        // Obtener los números ya usados en esta columna
        const usedInCol = [0, 1, 2]
          .filter(r => r !== row)
          .map(r => card[r][colToAdd])
          .filter(n => n !== null);
        
        card[row][colToAdd] = randomGenerator.nextIntExcluding(min, max, usedInCol);
        nullIndices.splice(randomIdx, 1);
      }
    }
  }
  
  return card;
};

export const BingoProvider = ({ children }) => {
  // Estado del generador
  const [printableCards, setPrintableCards] = useState([]);
  const [showPrintView, setShowPrintView] = useState(false);
  const [currentSeed, setCurrentSeed] = useState('');

  // Estado del juego de bingo
  const [gameActive, setGameActive] = useState(false);
  const [extractedNumbers, setExtractedNumbers] = useState([]);
  const [currentNumber, setCurrentNumber] = useState(null);
  const [remainingNumbers, setRemainingNumbers] = useState([]);
  const [intervalTime, setIntervalTime] = useState(5); // segundos entre cada número
  const [gameStatus, setGameStatus] = useState('idle'); // 'idle', 'running', 'paused', 'finished'

  // Estado para validación de cartones
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  // Estado de configuración
  const [voiceConfig, setVoiceConfig] = useState({
    rate: 0.9,          // Velocidad de habla (0.1 a 2)
    volume: 1.0,        // Volumen (0 a 1)
    enabled: true,      // Habilitar/deshabilitar el sonido
    announceDigits: true // Anunciar dígitos individualmente
  });

  // Referencias para los temporizadores
  const intervalRef = useRef(null);
  const speechTimeoutRef = useRef(null);
  
  // Referencia para la síntesis de voz
  const speechSynthRef = useRef(null);

  // Efecto para limpiar el intervalo cuando el componente se desmonta
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
      if (speechSynthRef.current) {
        speechSynthRef.current.cancel();
      }
    };
  }, []);

  // Inicializar la síntesis de voz - versión simplificada
  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      speechSynthRef.current = window.speechSynthesis;
    }
  }, []);

  // Función para leer el número en voz alta - versión configurable
  const speakNumber = useCallback((number) => {
    // Si el sonido está deshabilitado, no hacer nada
    if (!speechSynthRef.current || !voiceConfig.enabled) return;
    
    // Limpiar cualquier timeout pendiente
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    
    // Detener cualquier lectura en curso
    speechSynthRef.current.cancel();
    
    // Crear un nuevo mensaje con un pequeño retraso
    speechTimeoutRef.current = setTimeout(() => {
      // Primero crear un utterance para el número completo
      const utteranceNumber = new SpeechSynthesisUtterance();
      utteranceNumber.text = `${number}`;
      utteranceNumber.lang = 'es-ES';
      utteranceNumber.rate = voiceConfig.rate;
      utteranceNumber.volume = voiceConfig.volume;
      
      // Reproducir el número completo
      speechSynthRef.current.speak(utteranceNumber);
      
      // Si está habilitado anunciar dígitos y es un número de más de un dígito
      if (voiceConfig.announceDigits && number >= 10) {
        const numberAsText = number.toString();
        const digitsText = numberAsText.split('').join(', ');
        
        // Crear un timeout para hablar los dígitos después de 1.2 segundos
        const digitsTimeoutRef = setTimeout(() => {
          // Comprobar si la síntesis de voz sigue disponible
          if (!speechSynthRef.current) return;
          
          // Crear utterance para los dígitos
          const utteranceDigits = new SpeechSynthesisUtterance();
          utteranceDigits.text = digitsText;
          utteranceDigits.lang = 'es-ES';
          utteranceDigits.rate = voiceConfig.rate;
          utteranceDigits.volume = voiceConfig.volume;
          
          // Reproducir los dígitos
          speechSynthRef.current.speak(utteranceDigits);
        }, 1200); // Pausa de 1.2 segundos entre número y dígitos
        
        // Limpiar este timeout en caso de desmontaje
        return () => clearTimeout(digitsTimeoutRef);
      }
    }, 100);
  }, [voiceConfig]);

  // Generar cartones imprimibles (formato español) con una semilla específica
  const generatePrintableCards = (count, seed) => {
    if (count < 12 || count > 240 || count % 12 !== 0) {
      notification.error({
        message: 'Error',
        description: 'La cantidad de cartones debe ser múltiplo de 12 (entre 12 y 240)',
      });
      return;
    }

    // Si no se proporciona semilla, usar la fecha actual como semilla por defecto
    const seedToUse = seed || String(Date.now());
    setCurrentSeed(seedToUse);
    
    // Crear un generador aleatorio con la semilla dada
    const randomGenerator = new SeededRandom(seedToUse);
    
    // Generar los cartones usando el generador aleatorio con semilla
    const newCards = Array(count).fill().map(() => generateSpanishBingoCard(randomGenerator));
    setPrintableCards(newCards);
    setShowPrintView(true);
    
    notification.success({
      message: 'Cartones generados',
      description: `Se han generado ${count} cartones con la semilla: ${seedToUse}`,
    });
  };

  // Pausar la partida - definido antes de extractNextNumber para evitar errores
  const pauseGame = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setGameStatus('paused');
    
    notification.info({
      message: 'Partida pausada',
      description: 'Se ha pausado la extracción de números',
    });
  }, []);

  // Extraer el siguiente número - ahora con useCallback
  const extractNextNumber = useCallback(() => {
    setRemainingNumbers(prevRemaining => {
      if (prevRemaining.length === 0) {
        pauseGame();
        setGameStatus('finished');
        notification.info({
          message: 'Partida finalizada',
          description: 'Se han extraído todos los números (1-90)',
        });
        return [];
      }
      
      // Sacar el primer número del array de números restantes
      const nextNumber = prevRemaining[0];
      
      // Leer el número en voz alta
      speakNumber(nextNumber);
      
      // Actualizar otros estados
      setCurrentNumber(nextNumber);
      setExtractedNumbers(prevExtracted => [...prevExtracted, nextNumber]);
      
      // Devolver los números restantes actualizados
      return prevRemaining.slice(1);
    });
  }, [pauseGame, speakNumber]);

  // Iniciar la extracción automática de números
  const startNumberExtraction = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Sacar el primer número inmediatamente
    extractNextNumber();
    
    // Configurar el intervalo para sacar números automáticamente
    intervalRef.current = setInterval(() => {
      extractNextNumber();
    }, intervalTime * 1000);
    
    setGameStatus('running');
  }, [extractNextNumber, intervalTime]);

  // Reanudar la partida
  const resumeGame = useCallback(() => {
    startNumberExtraction();
    
    notification.success({
      message: 'Partida reanudada',
      description: 'Se ha reanudado la extracción de números',
    });
  }, [startNumberExtraction]);
  
  // Iniciar una nueva partida de bingo
  const startNewGame = useCallback(() => {
    // Generar un array con todos los números posibles (1-90)
    const allNumbers = Array.from({ length: 90 }, (_, i) => i + 1);
    
    // Desordenar el array para simular el bombo
    const shuffledNumbers = [...allNumbers];
    for (let i = shuffledNumbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledNumbers[i], shuffledNumbers[j]] = [shuffledNumbers[j], shuffledNumbers[i]];
    }
    
    setRemainingNumbers(shuffledNumbers);
    setExtractedNumbers([]);
    setCurrentNumber(null);
    setGameStatus('running');
    setGameActive(true);
    
    // Iniciar la extracción automática de números
    setTimeout(() => {
      startNumberExtraction();
    }, 100);
    
    notification.success({
      message: 'Partida iniciada',
      description: 'Se ha iniciado una nueva partida de bingo',
    });
  }, [startNumberExtraction]);

  // Terminar la partida
  const endGame = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    setGameStatus('idle');
    setGameActive(false);
    setCurrentNumber(null);
    
    notification.info({
      message: 'Partida terminada',
      description: 'Se ha terminado la partida actual',
    });
  }, []);

  // Cambiar el intervalo de tiempo entre números
  const changeIntervalTime = useCallback((seconds) => {
    setIntervalTime(seconds);
    
    // Si el juego está en marcha, reiniciar el intervalo con el nuevo tiempo
    if (gameStatus === 'running') {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      intervalRef.current = setInterval(() => {
        extractNextNumber();
      }, seconds * 1000);
    }
  }, [extractNextNumber, gameStatus]);

  // Efecto para limpiar el intervalo cuando cambie intervalTime
  useEffect(() => {
    // Solo actualizar si ya estamos corriendo
    if (gameStatus === 'running' && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = setInterval(extractNextNumber, intervalTime * 1000);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [intervalTime, extractNextNumber, gameStatus]);

  // Función para actualizar la configuración de voz
  const updateVoiceConfig = useCallback((newConfig) => {
    setVoiceConfig(prevConfig => ({
      ...prevConfig,
      ...newConfig
    }));
  }, []);

  // Generar un cartón específico usando una semilla y número de cartón
  const generateSpecificCard = useCallback((seed, cardNumber) => {
    if (!seed || cardNumber < 1) {
      return null;
    }
    
    // Crear un generador con la semilla específica
    const randomGenerator = new SeededRandom(seed);
    
    // Generar cartones hasta llegar al número deseado
    let card = null;
    for (let i = 1; i <= cardNumber; i++) {
      card = generateSpanishBingoCard(randomGenerator);
    }
    
    return card;
  }, []);

  // Verificar si una fila tiene línea (5 números marcados)
  const checkLine = useCallback((cardRow, extractedNums) => {
    // Filtrar los números no nulos de la fila
    const numbers = cardRow.filter(num => num !== null);
    // Verificar si todos los números de la fila están extraídos
    return numbers.every(num => extractedNums.includes(num));
  }, []);

  // Verificar si el cartón tiene bingo (todas las casillas marcadas)
  const checkBingo = useCallback((card, extractedNums) => {
    // Verificar fila por fila
    for (let row = 0; row < 3; row++) {
      const rowNumbers = card[row].filter(num => num !== null);
      // Si hay algún número en la fila que no está extraído, no hay bingo
      if (!rowNumbers.every(num => extractedNums.includes(num))) {
        return false;
      }
    }
    // Si todas las filas tienen todos sus números extraídos, hay bingo
    return true;
  }, []);

  // Función para validar un cartón según su serie y número
  const validateCard = useCallback((seed, cardNumber, validationType = 'both') => {
    setIsValidating(true);
    setValidationResult(null);
    
    try {
      // Generar el cartón a validar
      const card = generateSpecificCard(seed, cardNumber);
      
      if (!card) {
        throw new Error('No se pudo generar el cartón con los datos proporcionados');
      }
      
      // Verificar según el tipo de validación
      let hasLine = false;
      let lineNumber = -1;
      let hasBingo = false;
      
      // Verificar líneas
      if (validationType === 'line' || validationType === 'both') {
        for (let i = 0; i < 3; i++) {
          if (checkLine(card[i], extractedNumbers)) {
            hasLine = true;
            lineNumber = i + 1;
            break;
          }
        }
      }
      
      // Verificar bingo
      if (validationType === 'bingo' || validationType === 'both') {
        hasBingo = checkBingo(card, extractedNumbers);
      }
      
      // Preparar el resultado
      const result = {
        card,
        seed,
        cardNumber,
        hasLine,
        lineNumber,
        hasBingo,
        extractedNumbers: [...extractedNumbers],
        message: ''
      };
      
      // Mensaje según el resultado
      if (hasBingo) {
        result.message = '¡BINGO! El cartón tiene todos los números marcados.';
      } else if (hasLine) {
        result.message = `¡LÍNEA! Línea completa en la fila ${lineNumber}.`;
      } else {
        result.message = 'El cartón no tiene línea ni bingo con los números extraídos.';
      }
      
      setValidationResult(result);
      return result;
    } catch (error) {
      const errorResult = {
        hasLine: false,
        hasBingo: false,
        message: `Error: ${error.message || 'No se pudo validar el cartón'}`
      };
      setValidationResult(errorResult);
      return errorResult;
    } finally {
      setIsValidating(false);
    }
  }, [generateSpecificCard, checkLine, checkBingo, extractedNumbers]);

  // Valores del contexto
  const contextValue = {
    // Valores del generador de cartones
    printableCards,
    showPrintView,
    currentSeed,
    generatePrintableCards,
    setShowPrintView,
    
    // Valores del juego de bingo
    gameActive,
    gameStatus,
    extractedNumbers,
    currentNumber,
    remainingNumbers,
    intervalTime,
    
    // Funciones del juego de bingo
    startNewGame,
    extractNextNumber,
    pauseGame,
    resumeGame,
    endGame,
    changeIntervalTime,
    
    // Configuración
    voiceConfig,
    updateVoiceConfig,
    
    // Validación de cartones
    validateCard,
    validationResult,
    isValidating,
    setValidationResult
  };

  return (
    <BingoContext.Provider value={contextValue}>
      {children}
    </BingoContext.Provider>
  );
};

// Hook personalizado para usar el contexto
export const useBingo = () => {
  const context = useContext(BingoContext);
  if (!context) {
    throw new Error('useBingo debe usarse dentro de un BingoProvider');
  }
  return context;
};

export default BingoContext; 