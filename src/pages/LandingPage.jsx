import { useNavigate } from 'react-router-dom';
import { Sparkles, Calendar, Users, Shield, Scissors, Brush, Heart, Star } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/LandingPage.css';

//img
import LogoCarla from "../../public/FundoHero.png";

function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin, isCliente } = useAuth();

  return (
    <div className="landing-container">

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <img src={LogoCarla} alt="Logo Estúdio Carla Lelis" width="8%"/>
            <h1>Estúdio Carla Lelis</h1>
          </div>
          <nav className="nav">
            {!isAuthenticated ? (
              <>
                <button onClick={() => navigate('/login')} className="btn-outline">
                  Login
                </button>
                <button onClick={() => navigate('/register')} className="btn-primary">
                  Cadastro
                </button>
              </>
            ) : (
              <>
                {isAdmin && (
                  <button onClick={() => navigate('/admin/dashboard')} className="btn-primary">
                    Painel Admin
                  </button>
                )}
                {isCliente && (
                  <button onClick={() => navigate('/cliente/agendar')} className="btn-primary">
                    Agendar
                  </button>
                )}
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-bubble-1" />
        <div className="hero-bubble-2" />
        <div className="hero-content">
          <div className="hero-badge">
            <Sparkles size={13} />
            Beleza &amp; Bem-estar
          </div>
          <h2>
            Bem-vinda ao
            <span>Estúdio Carla Lelis</span>
          </h2>
          <p>
            Agende seus serviços com facilidade, cuide da sua beleza com quem entende de você.
          </p>
          <div className="hero-buttons">
            {!isAuthenticated ? (
              <>
                <button onClick={() => navigate('/register')} className="btn-large">
                  Agendar Agora
                </button>
                <button onClick={() => navigate('/login')} className="btn-large-outline">
                  Já tenho conta
                </button>
              </>
            ) : isCliente ? (
              <button onClick={() => navigate('/cliente/agendar')} className="btn-large">
                Agendar Agora
              </button>
            ) : (
              <button onClick={() => navigate('/admin/dashboard')} className="btn-large">
                Ir para Painel
              </button>
            )}
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <strong>500+</strong>
              <span>Clientes Satisfeitas</span>
            </div>
            <div className="hero-stat">
              <strong>5★</strong>
              <span>Avaliação Média</span>
            </div>
            <div className="hero-stat">
              <strong>17 anos</strong>
              <span>de Experiência</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="services">
        <div className="services-inner">
          <div className="section-header">
            <span className="section-label">Serviços</span>
            <h3>O que <span>oferecemos</span></h3>
            <p>Tratamentos exclusivos pensados para realçar a sua beleza natural</p>
          </div>
          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon">
                <Scissors size={28} />
              </div>
              <h4>Corte &amp; Estilo</h4>
              <p>Cortes modernos e personalizados para o seu rosto</p>
            </div>
            <div className="service-card">
              <div className="service-icon">
                <Brush size={28} />
              </div>
              <h4>Coloração</h4>
              <p>Mechas, luzes e coloração com produtos premium</p>
            </div>
            <div className="service-card">
              <div className="service-icon">
                <Heart size={28} />
              </div>
              <h4>Tratamentos</h4>
              <p>Hidratação profunda e reconstrução capilar</p>
            </div>
            <div className="service-card">
              <div className="service-icon">
                <Star size={28} />
              </div>
              <h4>Dia da Noiva</h4>
              <p>Pacotes especiais para o dia mais importante da sua vida</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="features-inner">
          <div className="section-header">
            <span className="section-label">Vantagens</span>
            <h3>Por que nos <span>escolher?</span></h3>
            <p>Mais que um salão — uma experiência completa de cuidado e beleza</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <Calendar size={42} />
              <h4>Agendamentos Fáceis</h4>
              <p>Marque seu horário favorito em poucos cliques, 24h por dia, direto pelo celular ou computador.</p>
            </div>
            <div className="feature-card">
              <Users size={42} />
              <h4>Profissionais Qualificadas</h4>
              <p>Equipe experiente, apaixonada e dedicada ao seu bem-estar, com atualizações constantes nas tendências.</p>
            </div>
            <div className="feature-card">
              <Shield size={42} />
              <h4>Segurança de Dados</h4>
              <p>Seus dados pessoais e histórico de atendimentos estão sempre protegidos e em total confidencialidade.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <span className="section-label" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>
            Comece hoje
          </span>
          <h2>Pronta para se cuidar?</h2>
          <p>
            Crie sua conta gratuitamente e agende seu primeiro atendimento em menos de 2 minutos.
          </p>
          <div className="cta-buttons">
            {!isAuthenticated ? (
              <>
                <button onClick={() => navigate('/register')} className="btn-large">
                  Criar Conta Grátis
                </button>
                <button onClick={() => navigate('/login')} className="btn-large-outline">
                  Fazer Login
                </button>
              </>
            ) : isCliente ? (
              <button onClick={() => navigate('/cliente/agendar')} className="btn-large">
                Agendar Agora
              </button>
            ) : (
              <button onClick={() => navigate('/admin/dashboard')} className="btn-large">
                Ir para Painel
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <Sparkles size={20} />
            <span>Estúdio Carla Lelis</span>
          </div>
          <p>&copy; 2024 Estúdio Carla Lelis. Todos os direitos reservados.</p>
          <div className="footer-links">
            <a href="https://www.instagram.com/estudiocarlalelis?igsh=MWppY3gxa2s0M2xsbA==" target='_blank' rel="noopener noreferrer">Instagram</a>
            <a href="https://wa.me/5589981389758" target="_blank" rel="noopener noreferrer">WhatsApp</a>
            <a href="#">Contato</a>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default LandingPage;