import React, { useRef } from 'react';
import { Button, Typography, Row, Col, Card } from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import PrintableBingoCard from '../PrintableBingoCard';
import './PrintPage.css';

const { Title } = Typography;

const PrintPage = ({ 
  cards, 
  seriesInfo = "A-1000000", 
  price = "5.00",
  startCardId = 1 
}) => {
  const printRef = useRef();

  // Función para generar un código de seguridad único para cada cartón
  const generateSecurityCode = (cardId) => {
    const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${randomPart}${cardId.toString().padStart(4, '0')}`;
  };

  // Función para imprimir la página
  const handlePrint = () => {
    window.print();
  };

  // Renderizar cartones en grupos de 6 (para un A4)
  const renderCardGroups = () => {
    const cardsPerPage = 6;
    const pagesCount = Math.ceil(cards.length / cardsPerPage);
    const pages = [];

    for (let pageIndex = 0; pageIndex < pagesCount; pageIndex++) {
      const startIndex = pageIndex * cardsPerPage;
      const pageCards = cards.slice(startIndex, startIndex + cardsPerPage);

      pages.push(
        <div key={`page-${pageIndex}`} className="print-page-container">
          {pageCards.map((card, index) => (
            <PrintableBingoCard
              key={`card-${startIndex + index}`}
              cardData={card}
              cardId={startCardId + startIndex + index}
              seriesInfo={seriesInfo}
              price={price}
              securityCode={generateSecurityCode(startCardId + startIndex + index)}
            />
          ))}
        </div>
      );
    }

    return pages;
  };

  return (
    <Card className="print-page-card">
      <div className="print-header">
        <Title level={3}>Vista previa de impresión</Title>
        <Button 
          type="primary" 
          icon={<PrinterOutlined />} 
          onClick={handlePrint}
        >
          Imprimir Cartones
        </Button>
      </div>

      <div className="print-instructions">
        <p>
          Se generarán {cards.length} cartones de bingo según el formato reglamentario.
          Los cartones se imprimirán en hojas A4, con 6 cartones por página.
        </p>
      </div>

      <div className="print-preview" ref={printRef}>
        {renderCardGroups()}
      </div>
    </Card>
  );
};

export default PrintPage; 