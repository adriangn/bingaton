import React from 'react';
import { Card, Row, Col, Typography } from 'antd';
import './BingoCard.css';

const { Title } = Typography;

// Las columnas del bingo tienen un rango específico de números
const COLUMN_RANGES = [
  { min: 1, max: 15 },   // B: 1-15
  { min: 16, max: 30 },  // I: 16-30
  { min: 31, max: 45 },  // N: 31-45
  { min: 46, max: 60 },  // G: 46-60
  { min: 61, max: 75 }   // O: 61-75
];

const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'];

const BingoCard = ({ cardData, markedNumbers, onNumberClick, cardId }) => {
  // Método para manejar el clic en un número
  const handleNumberClick = (number) => {
    if (onNumberClick) {
      onNumberClick(cardId, number);
    }
  };

  // Comprueba si un número está marcado
  const isMarked = (number) => {
    return markedNumbers && markedNumbers.includes(number);
  };

  return (
    <Card 
      title={<Title level={4}>Cartón #{cardId}</Title>}
      className="bingo-card"
      bordered={true}
    >
      {/* Encabezados con las letras B-I-N-G-O */}
      <Row className="bingo-header">
        {BINGO_LETTERS.map((letter, index) => (
          <Col span={4} key={`header-${index}`} className="bingo-cell header">
            {letter}
          </Col>
        ))}
      </Row>

      {/* Números del cartón (5x5) */}
      {[0, 1, 2, 3, 4].map((row) => (
        <Row key={`row-${row}`}>
          {[0, 1, 2, 3, 4].map((col) => {
            // El centro es un espacio libre
            if (row === 2 && col === 2) {
              return (
                <Col span={4} key={`cell-${row}-${col}`} className="bingo-cell free-space">
                  FREE
                </Col>
              );
            }

            const number = cardData[row][col];
            const numberMarked = isMarked(number);

            return (
              <Col
                span={4}
                key={`cell-${row}-${col}`}
                className={`bingo-cell ${numberMarked ? 'marked' : ''}`}
                onClick={() => handleNumberClick(number)}
              >
                {number}
              </Col>
            );
          })}
        </Row>
      ))}
    </Card>
  );
};

export default BingoCard; 