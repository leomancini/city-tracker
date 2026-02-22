export default function CityCard({ city, onRemove }) {
  return (
    <div className="city-card">
      <div className="city-card-info">
        <span className="city-card-name">{city.name}</span>
        {city.addedAt && (
          <span className="city-card-date">
            {new Date(city.addedAt).toLocaleDateString()}
          </span>
        )}
      </div>
      {onRemove && (
        <button className="btn-icon" onClick={() => onRemove(city.id)} title="Remove city">
          &times;
        </button>
      )}
    </div>
  )
}
