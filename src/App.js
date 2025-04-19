import React from 'react';
import { Layout, Menu, Typography } from 'antd';
import './App.css';

// Importar componentes del juego
import GameControls from './components/GameControls';
import PrintPage from './components/PrintPage';

// Importar el contexto
import { BingoProvider, useBingo } from './context/BingoContext';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

// Componente principal de la aplicación
const BingoGame = () => {
  const { 
    printableCards,
    generatePrintableCards,
    showPrintView
  } = useBingo();

  // Si hay cartones generados, mostrar la vista de impresión
  if (showPrintView && printableCards.length > 0) {
    return (
      <PrintPage 
        cards={printableCards} 
        seriesInfo="A-1000000"
        price="5.00"
        startCardId={1}
      />
    );
  }

  // De lo contrario, mostrar el formulario de generación
  return (
    <div className="bingo-game">
      <GameControls 
        onGeneratePrintableCards={generatePrintableCards}
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
          <div className="demo-logo" />
          <Menu
            theme="dark"
            mode="horizontal"
            defaultSelectedKeys={['1']}
            items={[
              { key: '1', label: 'Generador de Cartones' },
              { key: '2', label: 'Instrucciones' },
              { key: '3', label: 'Acerca de' }
            ]}
          />
        </Header>
        <Content style={{ padding: '0 50px', marginTop: 40 }}>
          <div style={{ padding: 24, background: '#fff', minHeight: 'calc(100vh - 200px)' }}>
            <Title level={2}>Bingaton - Generador de Cartones de Bingo</Title>
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
