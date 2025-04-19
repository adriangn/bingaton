import React, { createContext, useState, useContext } from 'react';
import { notification } from 'antd';

// Rango de números para el bingo (1-75 para el formato americano)
const BINGO_RANGE = { min: 1, max: 75 };

// Las columnas del bingo tienen un rango específico de números (formato americano)
const COLUMN_RANGES = [
  { min: 1, max: 15 },   // B: 1-15
  { min: 16, max: 30 },  // I: 16-30
  { min: 31, max: 45 },  // N: 31-45
  { min: 46, max: 60 },  // G: 46-60
  { min: 61, max: 75 }   // O: 61-75
];

// Condiciones de victoria en bingo
const WIN_CONDITIONS = {
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
  DIAGONAL: 'diagonal',
  FULL_CARD: 'fullCard'
};

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

// Generador de número aleatorio en un rango
const getRandomNumber = (min, max, exclude = []) => {
  let number;
  do {
    number = Math.floor(Math.random() * (max - min + 1)) + min;
  } while (exclude.includes(number));
  return number;
};

// Generar un cartón de bingo (formato americano 5x5)
const generateBingoCard = () => {
  const card = Array(5).fill().map(() => Array(5).fill(null));
  
  // Para cada columna
  for (let col = 0; col < 5; col++) {
    const { min, max } = COLUMN_RANGES[col];
    const colNumbers = [];
    
    // Generar 5 números únicos para cada columna
    for (let row = 0; row < 5; row++) {
      // Saltamos el centro libre
      if (row === 2 && col === 2) continue;
      
      const num = getRandomNumber(min, max, colNumbers);
      colNumbers.push(num);
      card[row][col] = num;
    }
  }
  
  // El centro es un espacio libre (valor 0)
  card[2][2] = 0;
  
  return card;
};

// Generar un cartón de bingo en formato español (3x9)
const generateSpanishBingoCard = () => {
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
      const randomIndex = Math.floor(Math.random() * rows.length);
      selectedRows.push(rows[randomIndex]);
      rows.splice(randomIndex, 1);
    }
    
    // Generar los números para las filas seleccionadas
    const usedNumbers = [];
    
    selectedRows.forEach(row => {
      const num = getRandomNumber(min, max, usedNumbers);
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
        const randomIdx = Math.floor(Math.random() * indices.length);
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
        const randomIdx = Math.floor(Math.random() * nullIndices.length);
        const colToAdd = nullIndices[randomIdx];
        const { min, max } = SPANISH_BINGO_COLUMNS[colToAdd];
        
        // Obtener los números ya usados en esta columna
        const usedInCol = [0, 1, 2]
          .filter(r => r !== row)
          .map(r => card[r][colToAdd])
          .filter(n => n !== null);
        
        card[row][colToAdd] = getRandomNumber(min, max, usedInCol);
        nullIndices.splice(randomIdx, 1);
      }
    }
  }
  
  return card;
};

export const BingoProvider = ({ children }) => {
  // Estado del juego
  const [cards, setCards] = useState([]);
  const [printableCards, setPrintableCards] = useState([]);
  const [markedNumbers, setMarkedNumbers] = useState({});
  const [drawnNumbers, setDrawnNumbers] = useState([]);
  const [remainingNumbers, setRemainingNumbers] = useState(Array.from({ length: BINGO_RANGE.max }, (_, i) => i + 1));
  const [lastNumber, setLastNumber] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [winner, setWinner] = useState(null);
  const [showPrintView, setShowPrintView] = useState(false);

  // Generar cartones (formato americano para jugar)
  const generateCards = (count) => {
    const newCards = Array(count).fill().map(() => generateBingoCard());
    setCards(newCards);
    setMarkedNumbers({});
    resetGame();
    setShowPrintView(false);
  };

  // Generar cartones imprimibles (formato español)
  const generatePrintableCards = (count) => {
    const newCards = Array(count).fill().map(() => generateSpanishBingoCard());
    setPrintableCards(newCards);
    setShowPrintView(true);
  };

  // Iniciar el juego
  const startGame = () => {
    if (cards.length === 0) {
      notification.error({
        message: 'Error',
        description: 'Debes generar al menos un cartón para jugar',
      });
      return;
    }
    
    setGameStarted(true);
    setGameEnded(false);
    setDrawnNumbers([]);
    setLastNumber(null);
    setWinner(null);
    setRemainingNumbers(Array.from({ length: BINGO_RANGE.max }, (_, i) => i + 1));
    setMarkedNumbers({});
  };

  // Sacar un número
  const drawNumber = () => {
    if (!gameStarted || gameEnded || remainingNumbers.length === 0) return;
    
    // Obtener un número aleatorio de los que quedan
    const randomIndex = Math.floor(Math.random() * remainingNumbers.length);
    const number = remainingNumbers[randomIndex];
    
    // Actualizar el estado
    setLastNumber(number);
    setDrawnNumbers([...drawnNumbers, number]);
    setRemainingNumbers(remainingNumbers.filter((_, index) => index !== randomIndex));
    
    // Marcar automáticamente el número en todos los cartones
    const newMarkedNumbers = { ...markedNumbers };
    
    cards.forEach((card, cardIndex) => {
      card.forEach((row, rowIndex) => {
        row.forEach((cardNumber, colIndex) => {
          if (cardNumber === number) {
            if (!newMarkedNumbers[cardIndex]) {
              newMarkedNumbers[cardIndex] = [];
            }
            newMarkedNumbers[cardIndex].push(cardNumber);
            
            // Verificar si hay un ganador después de marcar
            checkWinner(cardIndex, newMarkedNumbers[cardIndex]);
          }
        });
      });
    });
    
    setMarkedNumbers(newMarkedNumbers);
  };

  // Verificar si un cartón tiene una combinación ganadora
  const checkWinner = (cardIndex, markedNumbersForCard) => {
    if (!markedNumbersForCard) return false;
    
    const card = cards[cardIndex];
    let hasWinner = false;
    let winType = null;
    
    // Verificar filas horizontales
    for (let row = 0; row < 5; row++) {
      const rowNumbers = card[row].filter(n => n !== 0); // Excluir el centro libre
      const allMarked = rowNumbers.every(number => markedNumbersForCard.includes(number));
      
      if (allMarked) {
        hasWinner = true;
        winType = WIN_CONDITIONS.HORIZONTAL;
        break;
      }
    }
    
    // Verificar columnas verticales
    if (!hasWinner) {
      for (let col = 0; col < 5; col++) {
        const colNumbers = [];
        for (let row = 0; row < 5; row++) {
          if (!(row === 2 && col === 2)) { // Excluir el centro libre
            colNumbers.push(card[row][col]);
          }
        }
        
        const allMarked = colNumbers.every(number => markedNumbersForCard.includes(number));
        
        if (allMarked) {
          hasWinner = true;
          winType = WIN_CONDITIONS.VERTICAL;
          break;
        }
      }
    }
    
    // Verificar diagonales
    if (!hasWinner) {
      // Diagonal principal (de arriba a la izquierda a abajo a la derecha)
      const diagonal1 = [card[0][0], card[1][1], card[3][3], card[4][4]]; // Excluir el centro libre
      const allMarkedDiag1 = diagonal1.every(number => markedNumbersForCard.includes(number));
      
      // Diagonal secundaria (de arriba a la derecha a abajo a la izquierda)
      const diagonal2 = [card[0][4], card[1][3], card[3][1], card[4][0]]; // Excluir el centro libre
      const allMarkedDiag2 = diagonal2.every(number => markedNumbersForCard.includes(number));
      
      if (allMarkedDiag1 || allMarkedDiag2) {
        hasWinner = true;
        winType = WIN_CONDITIONS.DIAGONAL;
      }
    }
    
    if (hasWinner) {
      handleWinner(cardIndex, winType);
    }
    
    return hasWinner;
  };

  // Manejar cuando hay un ganador
  const handleWinner = (cardIndex, winType) => {
    setGameEnded(true);
    setWinner({ cardIndex, winType });
    
    notification.success({
      message: '¡BINGO!',
      description: `¡El cartón #${cardIndex + 1} ha ganado con ${winType}!`,
      duration: 0,
    });
  };

  // Reiniciar el juego
  const resetGame = () => {
    setGameStarted(false);
    setGameEnded(false);
    setDrawnNumbers([]);
    setLastNumber(null);
    setWinner(null);
    setRemainingNumbers(Array.from({ length: BINGO_RANGE.max }, (_, i) => i + 1));
    setMarkedNumbers({});
    setShowPrintView(false);
  };

  // Marcar manualmente un número en un cartón
  const markNumber = (cardIndex, number) => {
    if (!gameStarted || gameEnded) return;
    
    // Verificar si el número ha sido sacado
    if (!drawnNumbers.includes(number)) {
      notification.warning({
        message: 'Número no válido',
        description: 'Este número aún no ha sido sacado en el juego.',
      });
      return;
    }
    
    // Marcar el número
    const newMarkedNumbers = { ...markedNumbers };
    if (!newMarkedNumbers[cardIndex]) {
      newMarkedNumbers[cardIndex] = [];
    }
    
    // Evitar duplicados
    if (!newMarkedNumbers[cardIndex].includes(number)) {
      newMarkedNumbers[cardIndex].push(number);
      setMarkedNumbers(newMarkedNumbers);
      
      // Verificar si hay un ganador después de marcar
      checkWinner(cardIndex, newMarkedNumbers[cardIndex]);
    }
  };

  // Valores del contexto
  const contextValue = {
    cards,
    printableCards,
    drawnNumbers,
    lastNumber,
    gameStarted,
    gameEnded,
    winner,
    markedNumbers,
    showPrintView,
    generateCards,
    generatePrintableCards,
    startGame,
    drawNumber,
    resetGame,
    markNumber,
    setShowPrintView
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