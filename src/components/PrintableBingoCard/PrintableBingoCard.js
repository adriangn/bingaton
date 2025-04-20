import React from 'react';
import { Card, Typography, Divider } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import Logo from '../Logo';
import './PrintableBingoCard.css';

const { Text } = Typography;

const PrintableBingoCard = ({ 
  cardData, 
  cardId, 
  seriesInfo
}) => {
  return (
    <Card className="print-card" bordered={false}>
      <div className="corner-top-right"></div>
      <div className="corner-bottom-left"></div>
      
      <div className="print-card-header">
        <div className="print-card-number">
          <Text strong>Cartón: {String(cardId).padStart(4, '0')}</Text>
        </div>
        <div className="print-card-series">
          <Text strong>Serie: {seriesInfo}</Text>
        </div>
      </div>

      <Divider className="print-divider" />
      
      <div className="print-card-grid">
        {/* Renderiza la matriz 3x9 del cartón como una tabla */}
        <table className="bingo-table">
          <tbody>
            {[0, 1, 2].map(row => (
              <tr key={`row-${row}`}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(col => {
                  const number = cardData[row][col];
                  
                  return (
                    <td key={`cell-${row}-${col}`}>
                      <span className={`cell-content ${number === null ? 'empty-cell' : ''}`}>
                        {number !== null ? number : <GlobalOutlined className="globe-icon" />}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Espacio para el logo */}
      <div className="logo-space">
        <Logo size="small" printVersion={true} />
      </div>
    </Card>
  );
};

export default PrintableBingoCard;
