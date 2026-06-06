'use client'

import { useEffect, useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
)

export function OverviewChart() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return <div className="h-[300px] w-full animate-pulse bg-[hsl(var(--muted)/0.5)] rounded-2xl"></div>

  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
  
  const data = {
    labels,
    datasets: [
      {
        fill: true,
        label: 'Platform Engagement',
        data: [120, 190, 300, 500, 480, 600, 800],
        borderColor: 'hsl(271 81% 56%)', // sky-600
        backgroundColor: 'hsl(271 81% 56% / 0.15)',
        tension: 0.4,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(3, 7, 18, 0.8)', // Very dark gray for tooltip
        titleColor: '#fff',
        bodyColor: '#e2e8f0',
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
        }
      },
      y: {
        grid: {
          color: 'hsl(var(--border) / 0.5)',
        },
        border: {
          display: false,
        },
        ticks: {
          color: 'hsl(var(--muted-foreground))',
          padding: 10,
        }
      },
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
  }

  return (
    <div className="w-full h-[300px]">
      <Line options={options} data={data} />
    </div>
  )
}
