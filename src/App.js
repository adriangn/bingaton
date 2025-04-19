import React from 'react';
import { Button, Space, Typography, Card, Layout, Menu } from 'antd';
import './App.css';

const { Header, Content, Footer } = Layout;
const { Title, Paragraph } = Typography;

function App() {
  return (
    <Layout className="layout">
      <Header style={{ display: 'flex', alignItems: 'center' }}>
        <div className="demo-logo" />
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={['1']}
          items={[
            { key: '1', label: 'Inicio' },
            { key: '2', label: 'Acerca de' },
            { key: '3', label: 'Contacto' }
          ]}
        />
      </Header>
      <Content style={{ padding: '0 50px', marginTop: 40 }}>
        <div style={{ minHeight: 280, padding: 24, background: '#fff' }}>
          <Title level={2}>Bienvenido a mi aplicación React con Ant Design</Title>
          <Paragraph>
            Esta es una aplicación de ejemplo usando la biblioteca de componentes Ant Design.
          </Paragraph>
          <Card title="Componentes Ant Design" style={{ width: 300, marginBottom: 16 }}>
            <p>Ant Design proporciona una amplia variedad de componentes de UI</p>
          </Card>
          <Space>
            <Button type="primary">Botón Primario</Button>
            <Button>Botón Predeterminado</Button>
            <Button type="dashed">Botón Discontinuo</Button>
            <Button type="link">Botón Enlace</Button>
          </Space>
        </div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        Mi Aplicación React ©{new Date().getFullYear()} Creada con Ant Design
      </Footer>
    </Layout>
  );
}

export default App;
