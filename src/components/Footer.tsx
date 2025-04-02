
import { Footer as LayoutFooter } from '@/components/layout/Footer';

const Footer = (props: { language?: 'en' | 'sw' }) => {
  return <LayoutFooter language={props.language || 'en'} />;
};

export default Footer;
