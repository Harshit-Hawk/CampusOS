'use client'

import React from 'react'
import { 
  Home, Users, Calendar, Trophy, GraduationCap, Medal, User, Settings, 
  Search, Heart, MessageSquare, Share2, Compass, Bell, Shield, ArrowRight 
} from 'lucide-react'

export function HeroMockup() {
  return (
    <div className="relative w-full max-w-[720px] mx-auto lg:ml-auto aspect-[16/11] flex items-center justify-center select-none">
      
      {/* Light subtle glow behind mockups */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] bg-blue-500/5 rounded-full blur-[80px] -z-10" />

      {/* 1. LAPTOP MOCKUP */}
      <div className="relative w-[85%] left-[-5%] aspect-[16/10.2] bg-white border-[5px] border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Laptop Screen Top Bezel & Camera */}
        <div className="h-5 bg-slate-50 border-b border-slate-100 flex items-center justify-center relative shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          <div className="absolute left-3 flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
          </div>
        </div>

        {/* Laptop Screen Content Area */}
        <div className="flex-1 bg-slate-50 flex overflow-hidden text-[10px] text-slate-600">
          
          {/* Dashboard Left Sidebar */}
          <div className="w-[18%] bg-white border-r border-slate-150 p-2 flex flex-col gap-1.5 shrink-0">
            <div className="flex items-center gap-1 mb-2 px-1">
              <div className="w-4 h-4 bg-blue-600 rounded flex items-center justify-center shrink-0">
                <span className="text-white text-[9px] font-extrabold">C</span>
              </div>
              <span className="font-bold text-slate-800 text-[9px] tracking-tight">CampusOS</span>
            </div>
            
            <nav className="flex flex-col gap-0.5">
              {[
                { label: 'Home', icon: Home, active: true },
                { label: 'Clubs', icon: Users },
                { label: 'Events', icon: Calendar },
                { label: 'Leaderboard', icon: Trophy },
                { label: 'Academics', icon: GraduationCap },
                { label: 'Achievements', icon: Medal },
                { label: 'Profile', icon: User },
                { label: 'Settings', icon: Settings },
              ].map((item) => (
                <div 
                  key={item.label}
                  className={`flex items-center gap-1.5 px-1.5 py-1 rounded-md font-medium transition-colors ${
                    item.active 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'hover:bg-slate-100 text-slate-500'
                  }`}
                >
                  <item.icon className={`w-3 h-3 ${item.active ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span className="scale-90 origin-left">{item.label}</span>
                </div>
              ))}
            </nav>
          </div>

          {/* Dashboard Main Scrollable Area */}
          <div className="flex-1 flex overflow-hidden">
            
            {/* Feed Section (Left 62%) */}
            <div className="w-[62%] bg-slate-50 p-2.5 flex flex-col gap-2.5 overflow-y-auto border-r border-slate-150">
              
              {/* Header inside Feed */}
              <div className="flex items-center justify-between shrink-0">
                <span className="font-bold text-slate-900 text-xs">Feed</span>
                
                {/* Search Bar */}
                <div className="relative w-1/2">
                  <Search className="w-2.5 h-2.5 text-slate-400 absolute left-1.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    placeholder="What's happening on campus?" 
                    disabled
                    className="w-full bg-white border border-slate-200 rounded-md py-0.5 pl-5 pr-2 text-[7px] text-slate-450 outline-none"
                  />
                </div>
              </div>

              {/* Feed Post 1 (CodeClub Announcement) */}
              <div className="bg-white border border-slate-250/60 rounded-lg p-2 flex flex-col gap-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-[8px]">CC</div>
                    <div>
                      <div className="font-semibold text-slate-800 text-[8px] leading-tight">CodeClub</div>
                      <div className="text-[6px] text-slate-400">2h ago</div>
                    </div>
                  </div>
                  <span className="text-[7px] text-slate-400">2h ago</span>
                </div>

                <p className="text-slate-700 text-[8px] leading-normal font-medium">
                  Registrations are open for <span className="text-blue-600 font-semibold">HackOverflow 2024</span>
                </p>

                {/* Banner */}
                <div className="relative w-full aspect-[2/1] rounded-md overflow-hidden bg-slate-950 flex flex-col items-center justify-center p-3 text-center border border-slate-900 group">
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/60 via-slate-950 to-slate-950 opacity-90" />
                  
                  {/* Banner Content */}
                  <div className="relative z-10 flex flex-col items-center gap-1">
                    <span className="text-[6px] text-blue-400 font-bold uppercase tracking-wider">ANNUAL HACKATHON</span>
                    <h4 className="text-[12px] font-black text-white leading-none tracking-tight">HACK OVERFLOW</h4>
                    <span className="text-[5px] text-slate-400">MAY 26 - 28 • SEMINAR HALL</span>
                    <button className="mt-1.5 px-2.5 py-0.5 bg-blue-600 text-white rounded text-[5px] font-bold hover:bg-blue-700 transition-colors">
                      Register Now
                    </button>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-1.5 text-slate-400 text-[7px] px-1">
                  <div className="flex items-center gap-1 hover:text-slate-600 cursor-pointer">
                    <Heart className="w-2.5 h-2.5 text-slate-400" />
                    <span>134</span>
                  </div>
                  <div className="flex items-center gap-1 hover:text-slate-600 cursor-pointer">
                    <MessageSquare className="w-2.5 h-2.5" />
                    <span>12</span>
                  </div>
                  <div className="flex items-center gap-1 hover:text-slate-600 cursor-pointer">
                    <Share2 className="w-2.5 h-2.5" />
                    <span>Share</span>
                  </div>
                </div>
              </div>

              {/* Feed Post 2 (Design Society Workshop) */}
              <div className="bg-white border border-slate-250/60 rounded-lg p-2 flex flex-col gap-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-[8px]">DS</div>
                  <div>
                    <div className="font-semibold text-slate-800 text-[8px] leading-tight">Design Society</div>
                    <div className="text-[6px] text-slate-400">4h ago</div>
                  </div>
                </div>

                <p className="text-slate-700 text-[8px] leading-normal font-medium">
                  <span className="font-bold">UI UX Design Workshop</span><br />
                  Saturday, 10 AM - Seminar Hall
                </p>

                {/* Thumbnail placeholder */}
                <div className="w-full aspect-[2.2/1] rounded-md bg-slate-100 border border-slate-200 overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-tr from-slate-200 to-slate-50 flex items-center justify-center text-slate-350">
                    <Compass className="w-6 h-6 stroke-[1.5]" />
                  </div>
                </div>
              </div>

            </div>

            {/* Right Widget Area (Right 38%) */}
            <div className="w-[38%] bg-white p-2.5 flex flex-col gap-3.5 overflow-y-auto">
              
              {/* Upcoming Events */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between px-0.5">
                  <span className="font-bold text-slate-900 text-[8.5px]">Upcoming Events</span>
                  <span className="text-[6.5px] text-blue-600 font-bold hover:underline cursor-pointer">View all</span>
                </div>

                <div className="flex flex-col gap-1">
                  {[
                    { title: 'HackOverflow 2024', date: 'May 26 - 28', bg: 'bg-blue-500' },
                    { title: 'Tech Talk: Web3', date: 'May 29', bg: 'bg-slate-800' },
                    { title: 'Design Workshop', date: 'May 31', bg: 'bg-slate-700' },
                  ].map((evt) => (
                    <div key={evt.title} className="flex items-center gap-1.5 p-1 rounded border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      <div className={`w-4 h-4 rounded shrink-0 ${evt.bg} flex items-center justify-center text-white text-[5px] font-bold`}>
                        {evt.title[0]}
                      </div>
                      <div className="flex-1 overflow-hidden leading-tight">
                        <div className="font-bold text-slate-800 truncate text-[7.5px]">{evt.title}</div>
                        <div className="text-[6.5px] text-slate-400">{evt.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Contributors */}
              <div className="flex flex-col gap-1.5">
                <div className="px-0.5">
                  <span className="font-bold text-slate-900 text-[8.5px]">Top Contributors</span>
                </div>

                <div className="flex flex-col gap-1">
                  {[
                    { name: 'Rahul Sharma', title: 'Champion IV', color: 'bg-amber-100 text-amber-700' },
                    { name: 'Priya Singh', title: 'Visionary III', color: 'bg-blue-100 text-blue-700' },
                    { name: 'Harshit Kumar', title: 'Legend II', color: 'bg-slate-100 text-slate-700' },
                  ].map((user, idx) => (
                    <div key={user.name} className="flex items-center gap-1.5 py-0.5">
                      <div className="w-4 h-4 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-[7px] text-slate-650">
                        {user.name[0]}
                      </div>
                      <div className="flex-1 leading-none">
                        <div className="font-semibold text-slate-800 text-[7.5px]">{user.name}</div>
                        <div className="text-[6px] text-slate-400 mt-0.5">{user.title}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <button className="w-full mt-1 py-1 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-[7px] font-bold transition-colors">
                  View Leaderboard
                </button>
              </div>

            </div>

          </div>

        </div>

        {/* Laptop Chassis Bottom Base Bezel */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200 border-t border-slate-300" />
      </div>

      {/* Laptop Keyboard Base Piece (Trapezoidal Projection for 3D depth) */}
      <div className="absolute bottom-[3%] left-[2%] w-[76%] h-[3%] bg-slate-300 rounded-b-md shadow-lg border-t border-slate-100 -z-10 origin-top transform skew-x-3 scale-x-[1.04]" />

      {/* 2. OVERLAPPING MOBILE PHONE MOCKUP */}
      <div className="absolute right-[5%] bottom-[-2%] w-[28%] aspect-[9/18.5] bg-white border-[5px] border-slate-150 rounded-[28px] shadow-2xl overflow-hidden flex flex-col">
        
        {/* Phone Speaker & Camera Notch */}
        <div className="h-4 bg-white flex items-center justify-center relative shrink-0">
          <div className="w-10 h-3 bg-slate-100 rounded-full flex items-center justify-center px-2">
            <div className="w-4 h-1 bg-slate-300 rounded-full" />
            <div className="w-1.5 h-1.5 rounded-full bg-slate-350 ml-1.5" />
          </div>
        </div>

        {/* Phone Screen Area */}
        <div className="flex-1 bg-slate-50 p-2.5 flex flex-col gap-2.5 text-[8.5px] leading-tight select-none">
          
          {/* Greeting Header */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-black text-slate-900 text-[10px]">Hi, Harshit 👋</h4>
              <span className="text-[7px] text-slate-400">Welcome back</span>
            </div>
            <div className="w-6 h-6 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-700 text-[9px]">
              H
            </div>
          </div>

          {/* Gamification Level & XP Progress Card */}
          <div className="bg-slate-900 text-white rounded-lg p-2 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wide">Level 48</span>
              <span className="text-[6.5px] text-blue-400 font-bold">24,780 / 30,500 XP</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full w-[81%] bg-blue-500 rounded-full" />
            </div>
          </div>

          {/* Quick Access Icon Grid */}
          <div className="flex flex-col gap-1.5">
            <span className="font-bold text-slate-900 text-[8px] uppercase tracking-wide px-0.5">Quick Access</span>
            
            <div className="grid grid-cols-4 gap-1">
              {[
                { label: 'Events', icon: Calendar, bg: 'bg-blue-50 text-blue-600' },
                { label: 'Clubs', icon: Users, bg: 'bg-emerald-50 text-emerald-600' },
                { label: 'Leaderboard', icon: Trophy, bg: 'bg-amber-50 text-amber-600' },
                { label: 'Academics', icon: GraduationCap, bg: 'bg-purple-50 text-purple-600' },
              ].map((act) => (
                <div key={act.label} className="bg-white border border-slate-100 rounded-md p-1.5 flex flex-col items-center gap-1 hover:bg-slate-50 cursor-pointer shadow-[0_1px_1px_rgba(0,0,0,0.01)]">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center ${act.bg} shrink-0`}>
                    <act.icon className="w-3 h-3" />
                  </div>
                  <span className="text-[5.5px] font-bold text-slate-600 text-center truncate w-full">{act.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* My Events Widget */}
          <div className="flex flex-col gap-1.5 flex-1 overflow-hidden">
            <div className="flex items-center justify-between px-0.5">
              <span className="font-bold text-slate-900 text-[8px] uppercase tracking-wide">My Events</span>
              <span className="text-[6.5px] text-blue-600 font-bold">View all</span>
            </div>

            {/* Ticket Card */}
            <div className="bg-white border border-slate-200 rounded-lg p-1.5 flex-1 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)] min-h-[60px] relative overflow-hidden">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-slate-800 text-[8.5px] truncate w-[70%]">HackOverflow 2024</span>
                  <span className="px-1 py-[1px] bg-emerald-50 border border-emerald-100 text-emerald-600 rounded text-[5px] font-bold shrink-0">Registered</span>
                </div>
                <div className="text-[6px] text-slate-400">May 26 • 10:00 AM</div>
              </div>

              {/* Decorative barcode-like element */}
              <div className="flex justify-between items-end border-t border-dashed border-slate-200 pt-1.5 mt-1">
                <div className="flex gap-[1.5px] h-3 items-end">
                  {[2, 4, 1, 3, 2, 4, 1, 2, 3, 1, 4, 2].map((h, i) => (
                    <div 
                      key={i} 
                      className="bg-slate-400 w-[1px]" 
                      style={{ height: `${h * 20}%` }}
                    />
                  ))}
                </div>
                <span className="text-[5px] text-slate-400 tracking-wider">#HACK-0921</span>
              </div>
            </div>
          </div>

        </div>

        {/* Phone Home Indicator bar */}
        <div className="h-2 bg-white flex items-center justify-center shrink-0">
          <div className="w-12 h-[2.5px] bg-slate-350 rounded-full" />
        </div>
      </div>

    </div>
  )
}
