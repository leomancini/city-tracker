export default function CityCard({ city, onRemove }) {
  return (
    <div className="city-card">
      <div className="city-card-info">
        <span className="city-card-name">{city.name}</span>
      </div>
      {onRemove && (
        <button className="btn-icon" onClick={() => onRemove(city.id)} title="Remove city">
          &times;
        </button>
      )}
    </div>
  )
}
