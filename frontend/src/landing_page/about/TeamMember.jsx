import { useState } from "react";

function TeamMember({ image, name, designation, bio }) {
  let [showBio, setShowBio] = useState(false);
  return (
    <div className="col-12 col-sm-6 col-md-4 text-center mb-4">
      <img
        src={image}
        alt={name}
        style={{ width: "150px", height: "150px", borderRadius: "50%", objectFit: "cover" }}
      />
      <p className="mt-3" style={{ fontSize: "1.1rem", fontWeight: "500", color: "#424242" }}>
        {name}
      </p>
      <p className="text-muted" style={{ fontSize: "0.9rem" }}>{designation}</p>
      <p>
        <a
          href=""
          className="text-muted"
          onClick={(e) => {
            e.preventDefault();
            setShowBio(!showBio);
          }}
        >
          Bio{" "}
          <i
            className={
              showBio ? "fa-solid fa-angle-up" : "fa-solid fa-angle-down"
            }
          ></i>
        </a>
      </p>
      {showBio && (
        <p className="text-center mt-3 mx-auto" style={{ maxWidth: "280px", color: "#666", fontSize: "0.9rem", lineHeight: "1.7" }}>
          {bio}
        </p>
      )}
    </div>
  );
}

export default TeamMember;
