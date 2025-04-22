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
  const [linesClosed, setLinesClosed] = useState(false); // Indica si ya no se pueden registrar más líneas

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
  
  // Estado para configuración de premios
  const [prizeConfig, setPrizeConfig] = useState({
    seriesInfo: '',      // Serie de los cartones
    soldCards: 0,        // Cantidad de cartones vendidos
    cardPrice: 1.00,     // Precio por cartón
    linePercentage: 25,  // Porcentaje para premio línea (25% por defecto)
    bingoPercentage: 75, // Porcentaje para premio bingo (75% por defecto)
    totalPrizePercentage: 100, // Porcentaje total a repartir (100% por defecto)
    hasLineWinner: false, // Indica si ya hay ganador de línea
    hasMultipleLineWinners: false, // Indica si hay múltiples ganadores de línea
    lineWinners: [],     // Cartones ganadores de línea
    hasBingoWinner: false, // Indica si ya hay ganador de bingo
    hasMultipleBingoWinners: false, // Indica si hay múltiples ganadores de bingo
    bingoWinners: [],    // Cartones ganadores de bingo
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

  // Extraer el siguiente número
  const extractNextNumber = useCallback(() => {
    // Usar un método que asegure operaciones atómicas para evitar problemas de concurrencia
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
      
      // Establecer el número actual
      setCurrentNumber(nextNumber);
      
      // Actualizar la lista de números extraídos en una única operación atómica
      // Esto asegura que no haya actualizaciones duplicadas
      setExtractedNumbers(prevExtracted => {
        // Verificar que el número no esté ya en la lista
        if (prevExtracted.includes(nextNumber)) {
          return prevExtracted; // No duplicar
        }
        return [...prevExtracted, nextNumber];
      });
      
      // Devolver los números restantes actualizados
      return prevRemaining.slice(1);
    });
  }, [pauseGame, speakNumber, setGameStatus]);

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
    // Si hay ganadores de línea, cerrar la fase de líneas
    if (prizeConfig.hasLineWinner) {
      setLinesClosed(true);
      notification.warning({
        message: 'Fase de líneas cerrada',
        description: 'Ya no se pueden registrar más ganadores de línea',
      });
    }
    
    startNumberExtraction();
    
    notification.success({
      message: 'Partida reanudada',
      description: 'Se ha reanudado la extracción de números',
    });
  }, [startNumberExtraction, prizeConfig.hasLineWinner]);
  
  // Función para configurar los premios al iniciar el juego - convertida a useCallback
  const configurePrizes = useCallback((config) => {
    setPrizeConfig(prev => ({
      ...prev,
      ...config,
      hasLineWinner: false,
      hasMultipleLineWinners: false,
      lineWinners: [],
      hasBingoWinner: false,
      hasMultipleBingoWinners: false,
      bingoWinners: [],
    }));
  }, []);
  
  // Terminar la partida - movido antes de startNewGame
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
  
  // Iniciar una nueva partida de bingo
  const startNewGame = useCallback((prizeSettings = null) => {
    // Si hay un juego activo, terminarlo primero
    if (gameActive) {
      endGame();
    }
    
    // Configurar los premios si se proporcionan
    if (prizeSettings) {
      configurePrizes(prizeSettings);
    }
    
    // Generar array con números del 1 al 90
    const numbers = Array.from({ length: 90 }, (_, i) => i + 1);
    
    // Mezclar aleatoriamente los números
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    
    setRemainingNumbers(numbers);
    setExtractedNumbers([]);
    setCurrentNumber(null);
    setGameActive(true);
    setGameStatus('paused'); // Empezamos en pausa para permitir configuración adicional
    setLinesClosed(false); // Reiniciar estado de líneas cerradas al iniciar nueva partida
    
    notification.success({
      message: 'Juego iniciado',
      description: 'Presiona "Reanudar" para comenzar a extraer números.',
    });
  }, [gameActive, endGame, configurePrizes]);

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

  // Calcular premios
  const calculatePrize = useCallback((type) => {
    const { soldCards, cardPrice, linePercentage, bingoPercentage, totalPrizePercentage } = prizeConfig;
    
    if (!soldCards || !cardPrice) return 0;
    
    const totalPot = soldCards * cardPrice;
    const adjustmentFactor = totalPrizePercentage / 100;
    
    if (type === 'line') {
      const linePrize = totalPot * (linePercentage / 100) * adjustmentFactor;
      return linePrize;
    } else if (type === 'bingo') {
      const bingoPrize = totalPot * (bingoPercentage / 100) * adjustmentFactor;
      return bingoPrize;
    }
    
    return 0;
  }, [prizeConfig]);
  
  // Registrar un ganador
  const registerWinner = useCallback((type, cardNumber) => {
    if (type === 'line') {
      // Si las líneas están cerradas, no registrar ganador
      if (linesClosed) {
        return false;
      }
      
      // Verificar si ya hay un ganador de línea
      if (prizeConfig.hasLineWinner) {
        // Si ya hay un ganador, marcar como múltiples ganadores
        setPrizeConfig(prev => ({
          ...prev,
          hasMultipleLineWinners: true,
          lineWinners: [...prev.lineWinners, cardNumber]
        }));
      } else {
        // Registrar primer ganador de línea
        setPrizeConfig(prev => ({
          ...prev,
          hasLineWinner: true,
          lineWinners: [cardNumber]
        }));
      }
      return true;
    } else if (type === 'bingo') {
      // Verificar si ya hay un ganador de bingo
      if (prizeConfig.hasBingoWinner) {
        // Si ya hay un ganador, marcar como múltiples ganadores
        setPrizeConfig(prev => ({
          ...prev,
          hasMultipleBingoWinners: true,
          bingoWinners: [...prev.bingoWinners, cardNumber]
        }));
      } else {
        // Registrar primer ganador de bingo
        setPrizeConfig(prev => ({
          ...prev,
          hasBingoWinner: true,
          bingoWinners: [cardNumber]
        }));
      }
      return true;
    }
    return false;
  }, [prizeConfig, linesClosed]);

  // Función para validar cartones - modificada para incluir premios y callback
  const validateCard = useCallback((seed, cardNumber, validationType, callback, noRegister = false) => {
    setIsValidating(true);
    
    // Simulamos un pequeño delay para que parezca que está procesando
    setTimeout(() => {
      try {
        if (!seed || !cardNumber) {
          const result = {
            hasLine: false,
            hasBingo: false,
            message: 'La serie o el número de cartón son inválidos'
          };
          setValidationResult(result);
          if (callback) callback(result);
          return;
        }
        
        // Si está en fase de líneas y las líneas están cerradas, mostrar error
        if (validationType === 'line' && linesClosed) {
          const result = {
            hasLine: false,
            hasBingo: false,
            message: 'La fase de líneas está cerrada. Ya no se pueden registrar más líneas.',
            isLinesClosed: true
          };
          setValidationResult(result);
          if (callback) callback(result);
          return;
        }
        
        // Creamos el generador aleatorio con la semilla
        const randomGenerator = new SeededRandom(seed);
        
        // Generamos el cartón a partir de la semilla y el número de cartón
        // Necesitamos generar todos los cartones anteriores para mantener la secuencia
        let targetCard = null;
        for (let i = 1; i <= cardNumber; i++) {
          const card = generateSpanishBingoCard(randomGenerator);
          if (i === cardNumber) {
            targetCard = card;
          }
        }
        
        if (!targetCard) {
          const result = {
            hasLine: false,
            hasBingo: false,
            message: 'No se pudo generar el cartón correctamente'
          };
          setValidationResult(result);
          if (callback) callback(result);
          return;
        }
        
        // Comprobar si hay línea o bingo
        const result = {
          card: targetCard,
          cardNumber: cardNumber,
          hasLine: false,
          hasBingo: false,
          lineNumber: null,
          prize: 0,
          message: ''
        };
        
        // Comprobar si hay línea
        for (let row = 0; row < 3; row++) {
          const rowNumbers = targetCard[row].filter(n => n !== null);
          const allNumbersInRowExtracted = rowNumbers.every(n => extractedNumbers.includes(n));
          
          if (allNumbersInRowExtracted) {
            result.hasLine = true;
            result.lineNumber = row + 1;
            break;
          }
        }
        
        // Comprobar si hay bingo
        const allNumbers = targetCard.flat().filter(n => n !== null);
        const allExtracted = allNumbers.every(n => extractedNumbers.includes(n));
        result.hasBingo = allExtracted;
        
        // Determinar el resultado según el tipo de validación
        if (validationType === 'line') {
          if (result.hasLine) {
            // Si noRegister es true, no registramos el ganador
            const registered = noRegister ? true : registerWinner('line', cardNumber);
            if (!registered) {
              result.message = '⚠️ No se puede registrar línea: la fase de líneas está cerrada';
              result.prize = 0;
            } else {
              const linePrize = calculatePrize('line');
              result.prize = linePrize;
              
              // Si hay múltiples ganadores, dividir el premio
              if (!noRegister && prizeConfig.hasMultipleLineWinners) {
                result.prize = linePrize / prizeConfig.lineWinners.length;
                result.message = `¡Línea válida! Premio compartido: ${result.prize.toFixed(2)}€ (${prizeConfig.lineWinners.length} ganadores)`;
              } else {
                result.message = `¡Línea válida! Premio: ${linePrize.toFixed(2)}€`;
              }
            }
          } else {
            result.message = '❌ Este cartón no tiene línea con los números extraídos';
          }
        } else if (validationType === 'bingo') {
          if (result.hasBingo) {
            // Si noRegister es true, no registramos el ganador
            if (!noRegister) {
              registerWinner('bingo', cardNumber);
            }
            const bingoPrize = calculatePrize('bingo');
            result.prize = bingoPrize;
            
            // Si hay múltiples ganadores, dividir el premio
            if (!noRegister && prizeConfig.hasMultipleBingoWinners) {
              result.prize = bingoPrize / prizeConfig.bingoWinners.length;
              result.message = `¡Bingo válido! Premio compartido: ${result.prize.toFixed(2)}€ (${prizeConfig.bingoWinners.length} ganadores)`;
            } else {
              result.message = `¡Bingo válido! Premio: ${bingoPrize.toFixed(2)}€`;
            }
          } else {
            result.message = '❌ Este cartón no tiene bingo con los números extraídos';
          }
        }
        
        setValidationResult(result);
        if (callback) callback(result);
      } catch (error) {
        const result = {
          hasLine: false,
          hasBingo: false,
          message: `Error: ${error.message}`
        };
        setValidationResult(result);
        if (callback) callback(result);
      } finally {
        setIsValidating(false);
      }
    }, 1000);
  }, [extractedNumbers, calculatePrize, registerWinner, prizeConfig, linesClosed]);

  // Función para registrar múltiples ganadores
  const registerMultipleWinners = useCallback((type, cardNumbers) => {
    if (type === 'line' && linesClosed) {
      return false;
    }
    
    if (type === 'line') {
      setPrizeConfig(prev => ({
        ...prev,
        hasLineWinner: true,
        hasMultipleLineWinners: cardNumbers.length > 1 || prev.lineWinners.length > 0,
        lineWinners: [...new Set([...prev.lineWinners, ...cardNumbers])]
      }));
    } else if (type === 'bingo') {
      setPrizeConfig(prev => ({
        ...prev,
        hasBingoWinner: true,
        hasMultipleBingoWinners: cardNumbers.length > 1 || prev.bingoWinners.length > 0,
        bingoWinners: [...new Set([...prev.bingoWinners, ...cardNumbers])]
      }));
    }
    
    return true;
  }, [linesClosed]);

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
    linesClosed,
    
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
    setValidationResult,
    registerMultipleWinners,
    
    // Configuración de premios
    prizeConfig,
    configurePrizes,
    calculatePrize,
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