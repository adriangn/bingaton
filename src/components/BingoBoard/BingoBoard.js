import React from 'react';
import { Card, Row, Col, Typography } from 'antd';
import './BingoBoard.css';

const { Title } = Typography;

// Las letras del bingo
const BINGO_LETTERS = ['B', 'I', 'N', 'G', 'O'];

// Obtiene la letra BINGO para un número específico
const getLetterForNumber = (number) => {
  if (number >= 1 && number <= 15) return 'B';
  if (number >= 16 && number <= 30) return 'I';
  if (number >= 31 && number <= 45) return 'N';
  if (number >= 46 && number <= 60) return 'G';
  if (number >= 61 && number <= 75) return 'O';
  return '';
};

const BingoBoard = ({ drawnNumbers, lastNumber }) => {
  // Organizar los números por columna BINGO
  const organizeByColumn = () => {
    const columns = {
      B: [],
      I: [],
      N: [],
      G: [],
      O: []
    };

    drawnNumbers.forEach(number => {
      const letter = getLetterForNumber(number);
      if (letter) {
        columns[letter].push(number);
      }
    });

    return columns;
  };

  const columns = organizeByColumn();

  return (
    <Card className="bingo-board" title={<Title level={3}>Tablero de Bingo</Title>}>
      <div className="last-number-container">
        {lastNumber ? (
          <>
            <Title level={2}>Última bola</Title>
            <div className={`last-number ${lastNumber ? 'animated' : ''}`}>
              <span className="bingo-letter">{getLetterForNumber(lastNumber)}</span>
              <span className="number-value">{lastNumber}</span>
            </div>
          </>
        ) : (
          <Title level={4}>Pulse Iniciar Juego para comenzar</Title>
        )}
      </div>

      <div className="drawn-numbers">
        <Title level={4}>Números sacados</Title>
        <Row gutter={[16, 16]}>
          {BINGO_LETTERS.map(letter => (
            <Col span={4} key={letter}>
              <Card title={letter} className="column-card">
                <div className="column-numbers">
                  {columns[letter].map(number => (
                    <div key={number} className="drawn-number">
                      {number}
                    </div>
                  ))}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </Card>
  );
};

export default BingoBoard; 