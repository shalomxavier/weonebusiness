import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  iconColor?: string
  onClick?: () => void
}

export default function MetricCard({ title, value, description, icon: Icon, iconColor = 'text-purple-400', onClick }: MetricCardProps) {
  return (
    <div 
      onClick={onClick}
      className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl flex items-center justify-between hover:-translate-y-1 transition-transform duration-300 cursor-pointer"
    >
      <div>
        <h3 className="text-lg font-semibold text-gray-300 mb-2">{title}</h3>
        <p className="text-3xl font-bold text-white">{value}</p>
        {description && <p className="text-sm text-gray-400 mt-2">{description}</p>}
      </div>
      {Icon && (
        <div className="flex items-center justify-center">
          <Icon className={`w-8 h-8 ${iconColor}`} />
        </div>
      )}
    </div>
  )
}
