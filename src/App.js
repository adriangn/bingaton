import React, { useState } from 'react';
import { Layout, Menu, Typography } from 'antd';
import './App.css';

// Importar componentes del juego
import GameControls from './components/GameControls';
import PrintPage from './components/PrintPage';
import Logo from './components/Logo';
import BingoGame from './components/BingoGame';
import LegalNotice from './components/LegalNotice';

// Importar el contexto
import { BingoProvider, useBingo } from './context/BingoContext';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

// Componente principal de la aplicación
const BingoApp = ({ currentView }) => {
  const { 
    printableCards,
    showPrintView,
    currentSeed,
    generatePrintableCards
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

  // Si no, mostrar la vista correspondiente según la selección
  return (
    <div className="bingo-app">
      {currentView === 'generator' && (
        <>
          <Title level={2}>Generador de Cartones de Bingo</Title>
          <GameControls 
            onGeneratePrintableCards={generatePrintableCards}
            currentSeed={currentSeed}
          />
        </>
      )}
      
      {currentView === 'game' && (
        <>
          <Title level={2}>Partida de Bingo en Vivo</Title>
          <BingoGame />
        </>
      )}
    </div>
  );
};

// Componente App con proveedor de contexto
function App() {
  const [currentMenuKey, setCurrentMenuKey] = useState('1');
  const [showLegal, setShowLegal] = useState(false);
  
  const handleMenuClick = (e) => {
    setCurrentMenuKey(e.key);
  };
  
  return (
    <BingoProvider>
      <Layout className="layout">
        <Header style={{ display: 'flex', alignItems: 'center' }}>
          <Logo />
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={[currentMenuKey]}
            onClick={handleMenuClick}
            items={[
              { key: '1', label: 'Generador de Cartones' },
              { key: '2', label: 'Jugar al Bingo' }
            ]}
          />
        </Header>
        <Content style={{ padding: '0 50px', marginTop: 40 }}>
          <div style={{ padding: 24, background: '#fff', minHeight: 'calc(100vh - 200px)' }}>
            <BingoApp currentView={currentMenuKey === '1' ? 'generator' : 'game'} />
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>
          <a onClick={() => setShowLegal(true)} style={{ cursor: 'pointer' }}>Aviso Legal</a>
        </Footer>
        <LegalNotice isVisible={showLegal} onClose={() => setShowLegal(false)} />
      </Layout>
    </BingoProvider>
  );
}

export default App;
