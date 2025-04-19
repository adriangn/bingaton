import React from 'react';
import { Layout, Menu, Row, Col, Typography } from 'antd';
import './App.css';

// Importar componentes del juego
import BingoCard from './components/BingoCard';
import BingoBoard from './components/BingoBoard';
import GameControls from './components/GameControls';

// Importar el contexto
import { BingoProvider, useBingo } from './context/BingoContext';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

// Componente principal de la aplicación
const BingoGame = () => {
  const { 
    cards, 
    drawnNumbers, 
    lastNumber, 
    gameStarted, 
    gameEnded,
    markedNumbers,
    generateCards,
    startGame,
    drawNumber,
    resetGame,
    markNumber
  } = useBingo();

  // Renderizar cartones de bingo
  const renderBingoCards = () => {
    return cards.map((card, index) => (
      <Col key={index} xs={24} sm={12} md={8} lg={6}>
        <BingoCard 
          cardData={card} 
          cardId={index + 1} 
          markedNumbers={markedNumbers[index] || []}
          onNumberClick={markNumber}
        />
      </Col>
    ));
  };

  return (
    <div className="bingo-game">
      <GameControls 
        onStartGame={startGame}
        onDrawNumber={drawNumber}
        onGenerateCards={generateCards}
        onResetGame={resetGame}
        gameStarted={gameStarted}
        gameEnded={gameEnded}
        cardCount={cards.length}
      />

      <BingoBoard 
        drawnNumbers={drawnNumbers} 
        lastNumber={lastNumber}
      />

      <Row gutter={[16, 16]}>
        {renderBingoCards()}
      </Row>
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
              { key: '1', label: 'Bingo Game' },
              { key: '2', label: 'Instrucciones' },
              { key: '3', label: 'Acerca de' }
            ]}
          />
        </Header>
        <Content style={{ padding: '0 50px', marginTop: 40 }}>
          <div style={{ padding: 24, background: '#fff', minHeight: 'calc(100vh - 200px)' }}>
            <Title level={2}>Bingaton - Juego de Bingo</Title>
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
