import React from 'react';
import { Modal, Typography } from 'antd';
import './LegalNotice.css';

const { Title, Paragraph } = Typography;

const LegalNotice = ({ isVisible, onClose }) => {
  return (
    <Modal
      title="Aviso Legal"
      open={isVisible}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <Typography>
        <Title level={4}>1. Descargo de Responsabilidad</Title>
        <Paragraph>
          Esta aplicación web es una herramienta de demostración y se proporciona "TAL CUAL", sin ningún tipo de garantía, ya sea expresa o implícita. El uso de esta herramienta es completamente bajo su propia responsabilidad.
        </Paragraph>

        <Title level={4}>2. No Asociación con Entidades de Juego</Title>
        <Paragraph>
          Bingaton no está asociada, afiliada ni respaldada por ninguna entidad de juego, casino o empresa de apuestas. Esta aplicación es únicamente una demostración técnica y no debe utilizarse para juegos de azar reales o con fines comerciales.
        </Paragraph>

        <Title level={4}>3. Privacidad y Datos Personales</Title>
        <Paragraph>
          Esta aplicación no recolecta, almacena ni procesa ningún tipo de dato personal. Toda la funcionalidad se ejecuta localmente en su navegador y no se mantiene ningún registro de su actividad.
        </Paragraph>

        <Title level={4}>4. Uso Permitido</Title>
        <Paragraph>
          Esta herramienta está diseñada exclusivamente para fines de demostración, educativos o de entretenimiento personal sin ánimo de lucro. Cualquier uso comercial o en entornos de juego real está expresamente prohibido.
        </Paragraph>

        <Title level={4}>5. Propiedad Intelectual</Title>
        <Paragraph>
          El código fuente, diseño y elementos visuales de esta aplicación están protegidos por derechos de autor. Se permite su uso personal no comercial, quedando prohibida su distribución, modificación o uso comercial sin autorización expresa.
        </Paragraph>

        <Title level={4}>6. Limitación de Responsabilidad</Title>
        <Paragraph>
          Los creadores y contribuidores de Bingaton no serán responsables de ningún daño directo, indirecto, incidental, especial o consecuente que resulte del uso o la imposibilidad de uso de esta aplicación.
        </Paragraph>

        <Title level={4}>7. Jurisdicción</Title>
        <Paragraph>
          Este aviso legal se rige por la legislación española. Cualquier disputa relacionada con el uso de esta aplicación estará sujeta a la jurisdicción exclusiva de los tribunales de España.
        </Paragraph>
      </Typography>
    </Modal>
  );
};

export default LegalNotice; 