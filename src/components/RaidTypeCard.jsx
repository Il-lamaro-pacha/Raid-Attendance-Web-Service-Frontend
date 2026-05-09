import "../css/RaidTypeCard.css";

function RaidTypeCard({ id, name, selected, onClick }) {
  return (
    <div
      className={`raid-type-card ${selected ? "selected" : ""}`}
      onClick={onClick}
    >
      <h2>{name}</h2>
    </div>
  );
}

export default RaidTypeCard;