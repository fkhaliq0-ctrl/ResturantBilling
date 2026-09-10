import { playButtonPress } from '../utils/audio';

export default function CategoryGrid({ categories, onSelect }) {
  return (
    <div className="animate-fade-in">
      <h2 className="text-2xl font-bold text-white mb-4 px-1">
        👆 Select Category
      </h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              playButtonPress();
              onSelect(cat.id);
            }}
            className={`
              relative overflow-hidden rounded-2xl p-4 flex flex-col items-center justify-center
              bg-gradient-to-br ${cat.color}
              btn-press transition-all duration-150 
              shadow-lg hover:shadow-xl hover:scale-105
              min-h-[110px]
            `}
          >
            <span className="text-5xl sm:text-6xl mb-2 drop-shadow-lg">{cat.icon}</span>
            <span className="text-white font-bold text-sm sm:text-base text-center drop-shadow-md">
              {cat.name}
            </span>
            {cat.hi && (
              <span className="text-white/80 text-xs font-medium text-center mt-0.5">
                {cat.hi}
              </span>
            )}
            {cat.ur && (
              <span className="text-white/60 text-xs font-medium text-center mt-0.5" dir="rtl">
                {cat.ur}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
