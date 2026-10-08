import TeamMember from "./TeamMember.jsx";

function Team() {
  return (
    <div className="container mb-5 px-3 px-md-4">
      {/* Founder row */}
      <div className="row g-4 mb-5 align-items-center">
        <div className="col-12 col-md-4 text-center">
          <img
            src="assets/ayushphoto.jpg"
            alt="Ayush Prajapati"
            style={{ borderRadius: "50%", height: "200px", width: "200px", objectFit: "cover" }}
          />
          <h4 className="fs-5 my-3" style={{ fontWeight: "500" }}>
            Ayush Prajapati
          </h4>
          <h5 className="text-muted" style={{ fontSize: "0.9rem" }}>
            Full Stack Developer
          </h5>
        </div>
        <div
          className="col-12 col-md-8"
          style={{ lineHeight: "1.8rem", fontSize: "1.05rem" }}
        >
          <p>
            I am a Computer Science student and aspiring Software Developer with
            a strong foundation in Java, DSA, and web development. I am
            currently focused on building full-stack applications using the MERN
            stack and exploring AI/ML technologies.
          </p>
          <p>
            Connect on <a href="" style={{ color: "#387ED1" }}>Homepage</a> /{" "}
            <a href="" style={{ color: "#387ED1" }}>TradingQnA</a> /{" "}
            <a href="" style={{ color: "#387ED1" }}>Twitter</a>
          </p>
        </div>
      </div>

      {/* Team members – Row 1 */}
      <div className="row g-4 mt-3">
        <TeamMember
          image="assets/Nikhil.jpg"
          name="Nikhil Kamath"
          designation="Co-founder & CFO"
          bio="Nikhil is an astute and experienced investor, and he heads financial planning at Zerodha. An avid reader, he always appreciates a good game of chess."
        />
        <TeamMember
          image="assets/Kailash.jpg"
          name="Dr. Kailash Nadh"
          designation="CTO"
          bio="Kailash has a PhD in Artificial Intelligence & Computational Linguistics, and is the brain behind all our technology and products. He has been a developer from his adolescence and continues to write code every day."
        />
        <TeamMember
          image="assets/Venu.jpg"
          name="Venu Madhav"
          designation="COO"
          bio="Venu is the backbone of Zerodha taking care of operations and ensuring that we are compliant to rules and regulations. He has over a dozen certifications in financial markets and is also proficient in technical analysis."
        />
      </div>

      {/* Team members – Row 2 */}
      <div className="row g-4 mt-3">
        <TeamMember
          image="assets/Seema.jpg"
          name="Seema Patil"
          designation="Director"
          bio="Seema who has lead the quality team since the beginning of Zerodha, is now a director. She is an extremely disciplined fitness enthusiast."
        />
        <TeamMember
          image="assets/karthik.jpg"
          name="Karthik Rangappa"
          designation="Chief of Education"
          bio="Karthik 'Guru' Rangappa single handledly wrote Varsity, Zerodha's massive educational program. He heads investor education initiatives at Zerodha and loves stock markets, classic rock, single malts, and photography."
        />
        <TeamMember
          image="assets/Austin.jpg"
          name="Austin Prakesh"
          designation="Director Strategy"
          bio="Austin is a successful self-made entrepreneur from Singapore. His area of specialty revolves around helping organisations grow by optimizing revenue streams and creating growth strategies."
        />
      </div>
    </div>
  );
}

export default Team;
