import { Link } from 'react-router-dom'
import '../css/RaidCard.css'

function RaidCard({ id, name, image, selected, onClick }) {
  return (
      <div
        className={`card-bg ${selected ? 'selected' : ''}`}
        style={{ backgroundImage: `url(${image})` }}
        onClick={onClick}
      >
        <div className="overlay">
          <h2>{name}</h2>
        </div>
      </div>
  )
}

export default RaidCard