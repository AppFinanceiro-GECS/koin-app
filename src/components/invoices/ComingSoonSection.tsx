import { View, Text, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface ComingSoonItem {
  icon: string
  title: string
  description: string
}

interface ComingSoonSectionProps {
  title: string
  items: ComingSoonItem[]
}

export function ComingSoonSection({ title, items }: ComingSoonSectionProps) {
  return (
    <View className="mt-6">
      <Text className="text-white font-bold text-lg mb-3">{title}</Text>
      <View className="space-y-2">
        {items.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            disabled
            className="bg-slate-900/50 border border-dashed border-slate-700 rounded-lg p-4 flex-row items-center gap-3"
          >
            <View className="w-10 h-10 bg-slate-800 rounded-full items-center justify-center">
              <Ionicons name={item.icon as any} size={20} color="#64748b" />
            </View>
            <View className="flex-1">
              <Text className="text-slate-400 font-semibold">{item.title}</Text>
              <Text className="text-slate-500 text-xs">{item.description}</Text>
            </View>
            <View className="bg-slate-700 px-2 py-1 rounded">
              <Text className="text-slate-300 text-xs font-semibold">Em breve</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )
}
