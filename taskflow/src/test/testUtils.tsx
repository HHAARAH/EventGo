import { render as rtlRender, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

function render(ui: React.ReactElement) {
  return rtlRender(ui, { wrapper: BrowserRouter });
}

export { render, screen };
