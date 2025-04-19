import React, { createContext, useState, useContext } from 'react';
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

  // Valores del contexto
  const contextValue = {
    printableCards,
    showPrintView,
    currentSeed,
    generatePrintableCards,
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