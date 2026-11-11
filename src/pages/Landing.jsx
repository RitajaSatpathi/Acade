
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  Sparkles,
  CalendarDays,
  BookOpen,
  Users,
  GraduationCap,
} from 'lucide-react'

export default function Landing() {
  return (
    <div className="acade-landing">
      <div className="site-frame">

        {/* NAVIGATION */}
        <nav className="top-nav">
          <Link to="/" className="brand">
            <span className="brand-icon">✦</span>
            <span>Acade<span className="brand-dot">.</span></span>
          </Link>

          <div className="nav-links">
            <a href="#home">Home</a>
            <a href="#features">Features</a>
            <a href="#about">About Us</a>
            <a href="#community">Community</a>
          </div>

          <Link to="/login" className="login-button">
            Log In <ArrowUpRight size={15} />
          </Link>
        </nav>

        {/* HERO SECTION */}
        <main className="hero-section" id="home">
          <div className="hero-content">

            <div className="eyebrow">
              <Sparkles size={14} />
              YOUR ACADEMIC WORLD
              <Sparkles size={14} />
            </div>

            <div className="academic-watermark" aria-hidden="true">
              <GraduationCap />
            </div>

            <h1 className="acade-title">
              Acade<span className="title-sparkle">✧</span>
            </h1>

            <div className="title-line"></div>

            <h2 className="hero-heading">
              Where learning meets
              <br />
              <span>possibility.</span>
            </h2>

            <p className="hero-description">
              Bringing learning, organisation and ambition together —
              one academic journey at a time.
              <br />
              Your classes, schedules, assignments and achievements,
              beautifully connected in one place.
            </p>

            <Link to="/register" className="explore-button">
              Begin Your Journey
              <ArrowUpRight size={17} />
            </Link>
          </div>

          {/* MAGICAL COSMIC BACKGROUND */}
          <div className="cosmic-scene">
            <div className="star star-1">✦</div>
            <div className="star star-2">✧</div>
            <div className="star star-3">✦</div>
            <div className="star star-4">✧</div>
            <div className="star star-5">✦</div>
            <div className="star star-6">✧</div>
            <div className="star star-7">✦</div>
            <div className="star star-8">✧</div>

            <div className="orbit orbit-1"></div>
            <div className="orbit orbit-2"></div>

            <div className="wave-container">
              <div className="wave wave-1"></div>
              <div className="wave wave-2"></div>
              <div className="wave wave-3"></div>
            </div>

            <div className="glowing-sphere">
              <div className="sphere-shine"></div>
            </div>

            <div className="scene-caption">
              <span></span>
              A LITTLE MORE MAGIC IN EVERY DAY
              <span></span>
            </div>
          </div>
        </main>

        {/* FEATURES SECTION */}
        <section className="features-section" id="features">
          <div className="section-heading">
            <span className="section-label">THE ACADE EXPERIENCE</span>

            <h2>
              Everything that matters,
              <br />
              <i>in one space.</i>
            </h2>

            <p>
              A simpler, more connected way to experience your academic life.
            </p>
          </div>

          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <CalendarDays size={23} />
              </div>
              <h3>Organise</h3>
              <p>
                Keep track of timetables, classes, tests and upcoming deadlines.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <BookOpen size={23} />
              </div>
              <h3>Learn</h3>
              <p>
                Bring your academic activities and learning journey together.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <Users size={23} />
              </div>
              <h3>Connect</h3>
              <p>
                Create a more connected academic experience for students and teachers.
              </p>
            </div>
          </div>
        </section>

        {/* ABOUT SECTION */}
        <section className="about-section" id="about">
          <div className="about-star">✧</div>

          <p className="section-label">MORE THAN JUST ACADEMICS</p>

          <h2>
            Your journey deserves
            <br />
            <span>a space of its own.</span>
          </h2>

          <p className="about-description">
            From your first class to your biggest achievements,
            ACADE brings the little things that shape your academic
            journey into one beautiful experience.
          </p>

          <Link to="/register" className="explore-button">
            Discover ACADE
            <ArrowUpRight size={17} />
          </Link>
        </section>

        {/* FOOTER */}
        <footer className="bottom-footer" id="community">
          <Link to="/" className="footer-brand">
            Acade.
          </Link>

          <span>Learning · Organisation · Growth</span>
          <span>© 2026 ACADE</span>
        </footer>
      </div>

      {/* ALL STYLES */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Allura&family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,500;0,600;1,500&display=swap');

        * {
          box-sizing: border-box;
        }

        html {
          scroll-behavior: smooth;
        }

        .acade-landing {
          min-height: 100vh;
          padding: 0;
          position: relative;
          overflow: hidden;
          background: #0b0711;
          font-family: 'DM Sans', sans-serif;
          color: #ffffff;
        }

        .site-frame {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: none;
          min-height: 100vh;
          margin: 0;
          overflow: hidden;
          border: 0;
          border-radius: 0;
          background: #0b0711;
          box-shadow: none;
        }

        /* NAVIGATION */
        .top-nav {
          height: 78px;
          margin: 0 35px;
          border-bottom: 1px solid #a77bcb35;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          z-index: 5;
        }

        .brand {
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
          color: #d9baff;
          font-family: 'Allura', cursive;
          font-size: 38px;
          font-weight: 400;
        }

        .brand-icon {
          font-family: Georgia, serif;
          font-size: 20px;
          color: #bd83ff;
          text-shadow: 0 0 15px #bd83ff;
        }

        .brand-dot {
          color: #b47aff;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 32px;
        }

        .nav-links a {
          text-decoration: none;
          color: #eee4f6;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: .35px;
          transition: .25s;
        }

        .nav-links a:hover {
          color: #d7a8ff;
          text-shadow: 0 0 12px #bd83ff;
        }

        .login-button {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: white;
          padding: 10px 23px;
          border-radius: 30px;
          font-size: 12px;
          font-weight: 600;
          border: 1px solid #b77aff;
          background: linear-gradient(110deg, #58317e, #8c4bc2);
          box-shadow: 0 0 20px #a75aff33;
          transition: .3s;
        }

        .login-button:hover {
          box-shadow: 0 0 30px #b77aff99;
          transform: translateY(-2px);
        }

        /* HERO */
        .hero-section {
          min-height: 790px;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 65px 20px 0;
        }

        .hero-content {
          position: relative;
          z-index: 3;
          width: 100%;
        }

        .academic-watermark {
          position: absolute;
          z-index: -1;
          left: 50%;
          top: 42%;
          transform: translate(-50%, -50%);
          color: #c18aff;
          opacity: .055;
          pointer-events: none;
        }

        .academic-watermark svg {
          width: clamp(260px, 38vw, 510px);
          height: clamp(260px, 38vw, 510px);
          stroke-width: .75;
          filter: drop-shadow(0 0 28px #a85aff);
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: #c69bfa;
          font-size: 10px;
          letter-spacing: 3px;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .eyebrow svg {
          filter: drop-shadow(0 0 6px #bd83ff);
        }

        .acade-title {
          margin: 0;
          font-family: 'Allura', cursive;
          font-size: clamp(130px, 17vw, 210px);
          font-style: italic;
          font-weight: 400;
          line-height: .95;
          letter-spacing: 2px;
          color: #f5eaff;
          background: linear-gradient(
            110deg,
            #ffffff,
            #e8caff,
            #b68aff,
            #f5dfff,
            #ffffff
          );
          background-size: 250% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 0 17px #a75aff88);
          animation: title-shimmer 6s linear infinite;
        }

        .title-sparkle {
          font-family: Georgia, serif;
          font-size: 35px;
          vertical-align: top;
          margin-left: 5px;
          -webkit-text-fill-color: #e9c5ff;
          filter: drop-shadow(0 0 10px #c68aff);
        }

        .title-line {
          width: 150px;
          height: 1px;
          margin: 17px auto 21px;
          background: linear-gradient(
            90deg,
            transparent,
            #b67aff,
            #fff,
            #b67aff,
            transparent
          );
          box-shadow: 0 0 12px #ad65ff;
        }

        .hero-heading {
          margin: 0;
          font-family: 'Playfair Display', serif;
          font-size: clamp(28px, 3.7vw, 43px);
          font-weight: 500;
          line-height: 1.25;
          color: #eee3f7;
        }

        .hero-heading span {
          color: #c89cff;
          font-style: italic;
        }

        .hero-description {
          max-width: 660px;
          margin: 18px auto 25px;
          font-size: 13px;
          line-height: 1.9;
          color: #aaa0ba;
        }

        .explore-button {
          position: relative;
          z-index: 6;
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 13px 27px;
          border-radius: 30px;
          text-decoration: none;
          font-size: 12px;
          font-weight: 700;
          color: #fff;
          background: linear-gradient(110deg, #7d40c6, #b06bf2);
          border: 1px solid #d5a8ff88;
          box-shadow:
            0 0 20px #a85aff55,
            inset 0 0 10px #ffffff22;
          transition: .3s;
        }

        .explore-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 0 35px #b16cffaa;
        }

        /* COSMIC SCENE */
        .cosmic-scene {
          width: 100%;
          height: 310px;
          position: absolute;
          bottom: 0;
          left: 0;
          overflow: hidden;
          perspective: 600px;
          z-index: 1;
          pointer-events: none;
        }

        .cosmic-scene::before {
          content: '';
          position: absolute;
          left: 15%;
          right: 15%;
          bottom: 0;
          height: 250px;
          background: radial-gradient(
            ellipse,
            #9e3cff27,
            #55248b12 40%,
            transparent 75%
          );
          filter: blur(20px);
        }

        .star {
          position: absolute;
          z-index: 3;
          color: #bb7aff;
          text-shadow: 0 0 12px #bb7aff;
          animation: star-twinkle 3s ease-in-out infinite alternate;
        }

        .star-1 { left: 11%; top: 15%; font-size: 23px; }
        .star-2 { left: 28%; top: 28%; font-size: 17px; animation-delay: -1s; }
        .star-3 { right: 14%; top: 16%; font-size: 25px; animation-delay: -2s; }
        .star-4 { right: 30%; top: 28%; font-size: 17px; animation-delay: -1.5s; }
        .star-5 { left: 4%; top: 48%; font-size: 31px; }
        .star-6 { right: 5%; top: 48%; font-size: 31px; animation-delay: -2s; }
        .star-7 { left: 49%; top: 8%; font-size: 13px; }
        .star-8 { right: 45%; top: 35%; font-size: 11px; animation-delay: -1s; }

        .orbit {
          position: absolute;
          left: 50%;
          top: 67%;
          width: 490px;
          height: 170px;
          border: 1px solid #a74dff30;
          border-radius: 50%;
          transform: translate(-50%, -50%) rotateX(67deg);
        }

        .orbit-2 {
          width: 700px;
          height: 235px;
          border-color: #9d4aff20;
        }

        /* LIGHT WAVES */
        .wave-container {
          position: absolute;
          left: 50%;
          bottom: -70px;
          width: 100%;
          max-width: 1000px;
          height: 300px;
          transform: translateX(-50%);
          perspective: 500px;
        }

        .wave {
          position: absolute;
          left: -5%;
          top: 0;
          width: 110%;
          height: 100%;
          border-radius: 50%;
          transform: rotateX(64deg);
          background-image: radial-gradient(
            circle,
            #c06aff 1.05px,
            transparent 1.7px
          );
          background-size: 7px 7px;
          mask-image: radial-gradient(
            ellipse at 50% 25%,
            black 0%,
            #000b 42%,
            transparent 73%
          );
          -webkit-mask-image: radial-gradient(
            ellipse at 50% 25%,
            black 0%,
            #000b 42%,
            transparent 73%
          );
          filter: drop-shadow(0 0 4px #9e4aff);
        }

        .wave-1 {
          opacity: .38;
          transform: rotateX(65deg) scale(.92);
          animation: wave-pulse 5s ease-in-out infinite alternate;
        }

        .wave-2 {
          opacity: .75;
          transform: rotateX(64deg) scale(.98);
          background-size: 6px 6px;
        }

        .wave-3 {
          opacity: .35;
          transform: rotateX(62deg) scale(1.08);
          background-size: 8px 8px;
          filter: drop-shadow(0 0 7px #b85aff);
        }

        /* GLOWING SPHERE */
        .glowing-sphere {
          position: absolute;
          z-index: 2;
          left: 50%;
          top: 44%;
          width: 76px;
          height: 76px;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(
            circle at 35% 28%,
            #fff0ff 0%,
            #e6a5ff 17%,
            #c15aff 42%,
            #8627d9 75%,
            #4b187c 100%
          );
          box-shadow:
            0 0 15px #d08aff,
            0 0 35px #b04aff,
            0 0 80px #9b3affaa,
            0 0 130px #873bff55;
          animation: sphere-float 4s ease-in-out infinite;
        }

        .sphere-shine {
          position: absolute;
          top: 12px;
          left: 15px;
          width: 24px;
          height: 15px;
          border-radius: 50%;
          background: #fff;
          filter: blur(10px);
          opacity: .8;
        }

        .scene-caption {
          position: absolute;
          z-index: 4;
          bottom: 20px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 13px;
          color: #9273b1;
          font-size: 8px;
          letter-spacing: 3px;
        }

        .scene-caption span {
          height: 1px;
          width: 30px;
          background: #8c55b7;
        }

        /* FEATURES */
        .features-section {
          padding: 70px 7% 85px;
          position: relative;
          border-top: 1px solid #a77bcb25;
          background: #0b0711;
        }

        .section-heading {
          text-align: center;
          margin-bottom: 35px;
        }

        .section-label {
          color: #b88bdf;
          font-size: 9px;
          letter-spacing: 3px;
        }

        .section-heading h2 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(25px, 3vw, 38px);
          font-weight: 500;
          margin-top: 12px;
        }

        .section-heading h2 i {
          color: #c49aff;
        }

        .section-heading p {
          font-size: 12px;
          color: #a59bb3;
          margin-top: 12px;
        }

        .feature-grid {
          max-width: 1000px;
          margin: auto;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }

        .feature-card {
          text-align: center;
          padding: 28px 20px;
          border: 1px solid #b87bff20;
          border-radius: 12px;
          background: #ffffff06;
          transition: .3s;
        }

        .feature-card:hover {
          background: #a34aff12;
          border-color: #bd82ff66;
          transform: translateY(-5px);
        }

        .feature-icon {
          width: 45px;
          height: 45px;
          display: grid;
          place-items: center;
          margin: auto;
          border-radius: 12px;
          background: #a65aff20;
          color: #c79bff;
        }

        .feature-card h3 {
          font-size: 15px;
          margin: 17px 0 8px;
        }

        .feature-card p {
          font-size: 11px;
          color: #a59bb3;
          line-height: 1.8;
        }

        /* ABOUT */
        .about-section {
          padding: 85px 20px;
          text-align: center;
          background: #0b0711;
        }

        .about-star {
          font-size: 32px;
          color: #d4aaff;
          text-shadow: 0 0 20px #a65aff;
        }

        .about-section > p {
          font-size: 10px;
          letter-spacing: 2px;
          color: #ad8bcc;
        }

        .about-section h2 {
          font-family: 'Playfair Display', serif;
          font-size: clamp(29px, 4vw, 45px);
          font-weight: 500;
          line-height: 1.4;
          margin: 20px 0;
        }

        .about-section h2 span {
          color: #c49aff;
          font-style: italic;
        }

        .about-description {
          max-width: 560px;
          margin: 0 auto 27px;
          font-size: 12px;
          line-height: 1.9;
          color: #aaa0ba;
        }

        /* FOOTER */
        .bottom-footer {
          min-height: 70px;
          padding: 18px 35px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          border-top: 1px solid #a77bcb25;
          color: #877991;
          font-size: 10px;
          background: #0b0711;
        }

        .footer-brand {
          color: #d6b1ff;
          font-family: 'Allura', cursive;
          font-size: 32px;
          text-decoration: none;
        }

        /* ANIMATIONS */
        @keyframes title-shimmer {
          to {
            background-position: 250% center;
          }
        }

        @keyframes star-twinkle {
          from {
            opacity: .35;
            transform: scale(.8);
          }

          to {
            opacity: 1;
            transform: scale(1.2);
          }
        }

        @keyframes sphere-float {
          0%, 100% {
            margin-top: 0;
          }

          50% {
            margin-top: -12px;
          }
        }

        @keyframes wave-pulse {
          from {
            opacity: .2;
          }

          to {
            opacity: .55;
          }
        }

        /* RESPONSIVE */
        @media (max-width: 750px) {
          .acade-landing {
            padding: 0;
          }

          .top-nav {
            margin: 0 15px;
            height: 67px;
          }

          .nav-links {
            display: none;
          }

          .brand {
            font-size: 30px;
          }

          .hero-section {
            min-height: 730px;
            padding-top: 75px;
          }

          .acade-title {
            font-size: clamp(115px, 25vw, 160px);
          }

          .hero-heading {
            font-size: 27px;
          }

          .hero-description {
            max-width: 450px;
            font-size: 12px;
          }

          .cosmic-scene {
            height: 280px;
          }

          .glowing-sphere {
            top: 44%;
            width: 60px;
            height: 60px;
          }

          .academic-watermark {
            top: 43%;
          }

          .feature-grid {
            grid-template-columns: 1fr;
          }

          .bottom-footer {
            flex-wrap: wrap;
            justify-content: center;
            text-align: center;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .acade-title,
          .star,
          .glowing-sphere,
          .wave-1 {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
