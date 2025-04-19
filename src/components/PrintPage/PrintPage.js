import React, { useRef } from 'react';
import { Button, Typography, Card, Tag, message } from 'antd';
import { PrinterOutlined, RollbackOutlined, FilePdfOutlined } from '@ant-design/icons';
import PrintableBingoCard from '../PrintableBingoCard';
import { useBingo } from '../../context/BingoContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './PrintPage.css';

const { Title, Text, Paragraph } = Typography;

const PrintPage = ({ 
  cards, 
  seriesInfo = "A-1000000", 
  startCardId = 1 
}) => {
  const printRef = useRef();
  const { setShowPrintView } = useBingo();

  // Función para generar PDF en formato A4 y descargarlo
  const handleGeneratePDF = async () => {
    message.loading('Generando PDF en formato A4...', 0);
    
    try {
      // Generar el PDF
      const pdf = await generatePDF();
      
      // Guardamos el PDF con nombre descriptivo
      const fileName = `Cartones_Bingo_Serie_${seriesInfo.replace(/\s/g, '_')}.pdf`;
      pdf.save(fileName);
      
      message.destroy();
      message.success('PDF generado correctamente');
    } catch (error) {
      message.destroy();
      message.error('Error al generar el PDF: ' + error.message);
      console.error('Error generando PDF:', error);
    }
  };

  // Función para generar PDF e imprimirlo directamente
  const handlePrintPDF = async () => {
    message.loading('Preparando impresión...', 0);
    
    try {
      // Generar el PDF
      const pdf = await generatePDF();
      
      // Convertir el PDF a una URL de datos para abrirlo en una nueva pestaña
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      
      // Abrir en una nueva pestaña para impresión directa
      const printWindow = window.open(blobUrl, '_blank');
      
      // Esperar a que cargue para ejecutar la impresión
      printWindow.addEventListener('load', () => {
        try {
          printWindow.print();
          message.destroy();
        } catch (err) {
          console.error('Error al imprimir:', err);
        }
      });
      
      message.destroy();
    } catch (error) {
      message.destroy();
      message.error('Error al preparar la impresión: ' + error.message);
      console.error('Error preparando la impresión:', error);
    }
  };

  // Función auxiliar para generar el PDF
  const generatePDF = async () => {
    // Opciones de A4 en jsPDF (210 x 297 mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });
    
    // Obtenemos todos los grupos de páginas (cada uno con 12 cartones)
    const pageContainers = document.querySelectorAll('.print-page-container');
    
    // Para cada contenedor de página, creamos una página en el PDF
    for (let i = 0; i < pageContainers.length; i++) {
      // Si no es la primera página, añadimos una nueva
      if (i > 0) {
        pdf.addPage('a4', 'portrait');
      }
      
      // Convertimos el contenedor actual a canvas
      const canvas = await html2canvas(pageContainers[i], {
        scale: 3, // Mayor calidad
        useCORS: true,
        logging: false,
        allowTaint: true,
        width: 793, // 210mm en píxeles (a 96dpi)
        height: 1123 // 297mm en píxeles (a 96dpi)
      });
      
      // Añadimos el canvas como imagen al PDF
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      // Usamos las dimensiones exactas de A4 sin márgenes
      const pageWidth = 210;
      const pageHeight = 297;
      
      // Añadimos la imagen al tamaño exacto de la página
      pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
    }
    
    return pdf;
  };

  // Función para volver al generador
  const handleBackToGenerator = () => {
    setShowPrintView(false);
  };

  // Renderizar cartones en grupos de 12 (para un A4)
  const renderCardGroups = () => {
    const cardsPerPage = 12;
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
        <div>
          <Title level={3}>Vista previa de impresión</Title>
          <Paragraph>
            <Text>Serie de los cartones: </Text>
            <Tag color="blue">{seriesInfo}</Tag>
            <Text type="secondary"> (Esta serie se usa como semilla para generar los cartones)</Text>
          </Paragraph>
        </div>
        <div className="print-actions">
          <Button 
            style={{ marginRight: 10 }}
            onClick={handleBackToGenerator}
            icon={<RollbackOutlined />}
          >
            Volver al Generador
          </Button>
          <Button 
            type="primary" 
            icon={<FilePdfOutlined />} 
            onClick={handleGeneratePDF}
            style={{ marginRight: 10 }}
          >
            Generar PDF (A4)
          </Button>
          <Button 
            icon={<PrinterOutlined />} 
            onClick={handlePrintPDF}
          >
            Imprimir PDF
          </Button>
        </div>
      </div>

      <div className="print-instructions">
        <p>
          Se han generado {cards.length} cartones de bingo según el formato reglamentario europeo (3x9).
          Los cartones se imprimirán en hojas A4, con 12 cartones por página (6x2), perfectamente alineados para cortar siguiendo las marcas de corte de las esquinas.
        </p>
      </div>

      <div className="print-preview" ref={printRef}>
        {renderCardGroups()}
      </div>
    </Card>
  );
};

export default PrintPage; 