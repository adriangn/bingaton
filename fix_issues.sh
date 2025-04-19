#!/bin/bash

# Arreglar el problema de indentación en App.js
cat > src/App.js << 'EOL'
import React from 'react';
import { Layout, Menu, Typography } from 'antd';
import './App.css';

// Importar componentes del juego
import GameControls from './components/GameControls';
import PrintPage from './components/PrintPage';
import Logo from './components/Logo';

// Importar el contexto
import { BingoProvider, useBingo } from './context/BingoContext';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

// Componente principal de la aplicación
const BingoGame = () => {
  const { 
    printableCards,
    generatePrintableCards,
    showPrintView,
    currentSeed
  } = useBingo();

  // Si hay cartones generados, mostrar la vista de impresión
  if (showPrintView && printableCards.length > 0) {
    return (
      <PrintPage 
        cards={printableCards} 
        seriesInfo={currentSeed || "A-1000000"}
        startCardId={1}
      />
    );
  }

  // De lo contrario, mostrar el formulario de generación
  return (
    <div className="bingo-game">
      <GameControls 
        onGeneratePrintableCards={generatePrintableCards}
        currentSeed={currentSeed}
      />
    </div>
  );
};

// Componente App con proveedor de contexto
function App() {
  return (
    <BingoProvider>
      <Layout className="layout">
        <Header style={{ display: 'flex', alignItems: 'center' }}>
          <Logo />
          <Menu
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={['1']}
            items={[
              { key: '1', label: 'Generador de Cartones' }
            ]}
          />
        </Header>
        <Content style={{ padding: '0 50px', marginTop: 40 }}>
          <div style={{ padding: 24, background: '#fff', minHeight: 'calc(100vh - 200px)' }}>
            <Title level={2}>Generador de Cartones de Bingo</Title>
            <BingoGame />
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          Bingaton ©{new Date().getFullYear()} Creado con React y Ant Design
        </Footer>
      </Layout>
    </BingoProvider>
  );
}

export default App;
EOL

# Arreglar problemas en el componente Logo
cat > src/components/Logo/Logo.js << 'EOL'
import React from 'react';
import './Logo.css';

const Logo = ({ size = 'default', className = '', onClick }) => {
  const sizeClass = size === 'small' ? 'logo-small' : 
                    size === 'large' ? 'logo-large' : 
                    'logo-default';

  return (
    <div 
      className={`bingaton-logo ${sizeClass} ${className}`}
      onClick={onClick}
    >
      Bingaton
    </div>
  );
};

export default Logo;
EOL

# Arreglar el PrintableBingoCard.js
cat > src/components/PrintableBingoCard/PrintableBingoCard.js << 'EOL'
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
        <Logo size="small" />
      </div>
    </Card>
  );
};

export default PrintableBingoCard;
EOL

# Añadir todos los cambios
git add .

echo "Archivos corregidos y añadidos al área de staging" 