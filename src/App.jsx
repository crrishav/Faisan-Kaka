import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './homePage.jsx';
import ProductDetailsPage from './Pages/productDetailsPage.jsx';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/product/:slug" element={<ProductDetailsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
