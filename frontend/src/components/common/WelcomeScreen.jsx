import './WelcomeScreen.css';

export default function WelcomeScreen({ onStart }) {
  return (
    <main className="welcome-screen">

      {/* Animated Stars */}
      <span className="home-star hs1" />
      <span className="home-star hs2" />
      <span className="home-star hs3" />
      <span className="home-star hs4" />
      <span className="home-star hs5" />
      <span className="home-star hs6" />
      <span className="home-star hs7" />
      <span className="home-star hs8" />

      {/* Animated Dots */}
      <span className="home-dot hd1" />
      <span className="home-dot hd2" />
      <span className="home-dot hd3" />
      <span className="home-dot hd4" />

      {/* Welcome Content */}
      <section className="welcome-content">

        <div className="welcome-brand">
          <h2>
            <span>Go</span><span>Can</span>
          </h2>

          <p>CAMPUS FOOD PLATFORM</p>
        </div>

        <h1>
          <span className="welcome-blue">
            Hungry?
          </span>

          <span className="welcome-red">
            Let's GoCan.
          </span>
        </h1>

        <p className="welcome-description">
          Pesan makanan kantin kampus tanpa perlu antre.
        </p>

        <button
          className="welcome-button"
          onClick={onStart}
        >
          Mulai Pesan
        </button>

      </section>

    </main>
  );
}