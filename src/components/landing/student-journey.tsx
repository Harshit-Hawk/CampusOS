'use client'

import { useRef } from 'react'
import { motion } from 'framer-motion'
import { Flag, Users, Calendar, Award, User, Briefcase } from 'lucide-react'

const steps = [
  { 
    id: 1, 
    title: 'Join Campus', 
    desc: 'Create your profile and be a part of your campus.',
    icon: Flag 
  },
  { 
    id: 2, 
    title: 'Join Clubs', 
    desc: 'Explore clubs and find your passion.',
    icon: Users 
  },
  { 
    id: 3, 
    title: 'Attend Events', 
    desc: 'Participate, learn and grow.',
    icon: Calendar 
  },
  { 
    id: 4, 
    title: 'Earn Achievements', 
    desc: 'Unlock badges, earn XP and level up.',
    icon: Award 
  },
  { 
    id: 5, 
    title: 'Build Your Profile', 
    desc: 'Showcase your skills, activities and impact.',
    icon: User 
  },
  { 
    id: 6, 
    title: 'Get Opportunities', 
    desc: 'Discover placements, internships and more.',
    icon: Briefcase 
  },
]

export function StudentJourney() {
  return (
    <div className="py-20 bg-slate-50 border-t border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Section Title */}
        <div className="text-center mb-16">
          <span className="text-[11px] font-bold text-blue-600 tracking-widest uppercase block mb-3">
            YOUR JOURNEY WITH CAMPUSOS
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">
            The Complete Student Lifecycle
          </h2>
        </div>

        {/* Timeline Container */}
        <div className="relative">
          
          {/* Horizontal Connecting Dashed Line (Desktop Only) */}
          <div className="absolute top-[28px] left-[8%] right-[8%] h-[2px] border-t-2 border-dashed border-slate-200 hidden lg:block -z-0" />

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 relative z-10">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={step.id} className="flex flex-col items-center text-center group">
                  
                  {/* Icon Circle */}
                  <div className="w-14 h-14 rounded-full border-2 border-slate-200 bg-white flex items-center justify-center text-blue-600 shadow-sm transition-all duration-300 group-hover:border-blue-500 group-hover:scale-105 shrink-0 z-10 mb-4">
                    <Icon className="w-6 h-6 stroke-[1.75]" />
                  </div>

                  {/* Text Details */}
                  <h3 className="text-sm font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-[160px] mx-auto">
                    {step.desc}
                  </p>

                </div>
              )
            })}
          </div>

        </div>

      </div>
    </div>
  )
}
