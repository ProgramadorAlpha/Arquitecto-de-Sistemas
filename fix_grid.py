import re

with open('src/components/Tabs/DashboardTab.jsx', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Expand columns to prevent white gaps, move Lectura to Col 1
# Actually let's just use regular expressions to safely manipulate the content.

# Remove hardcoded backgrounds
code = code.replace('className="widget-card !bg-[#13151A] border-[#2A2D35]"', 'className="widget-card"')
code = code.replace('className="widget-card !bg-[#13151A] border-[#2A2D35] relative"', 'className="widget-card relative"')
code = code.replace('className="widget-card !bg-[#13151A] border-[#2A2D35] overflow-hidden"', 'className="widget-card overflow-hidden"')

# Remove fixed darker backgrounds inside cards
code = code.replace("bg-[#1A1D24] border-[#2A2D35]", "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700")
code = code.replace("bg-[#1A1D24] rounded-xl border border-[#2A2D35]", "bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700")
code = code.replace("bg-[#1A1D24] rounded-xl border border-amber-500/10", "bg-amber-50/50 dark:bg-slate-800 rounded-xl border border-amber-500/10")
code = code.replace("bg-[#1A1D24] border border-[#2A2D35]", "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700")

# For modes in energy journal
code = code.replace("bg-[#1A1D24] border-[#2A2D35] hover:border-white/10", "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-500/30")

# For bars in history (empty)
code = code.replace("bg-[#1A1D24] rounded-md", "bg-slate-100 dark:bg-slate-800 rounded-md")
code = code.replace("background: '#2A2D35'", "background: '#d1d5db' /* light equivalent */")

# The Cierre nocturno and final row
code = code.replace('className="widget-card !bg-gradient-to-br from-indigo-900/70 to-indigo-950 border-indigo-800/30 min-h-0"', 'className="widget-card bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-900/40 dark:to-slate-900 border-indigo-200 dark:border-indigo-800/30 min-h-0"')
code = code.replace('className="widget-card border-red-900/40 relative min-h-0"', 'className="widget-card bg-red-50/30 dark:bg-transparent border-red-200 dark:border-red-900/40 relative min-h-0"')

# Fix Cierre Nocturno items background
code = code.replace("bg-[#13151A] transition-all hover:bg-indigo-500/5", "bg-slate-50 dark:bg-slate-900 transition-all hover:bg-indigo-50 dark:hover:bg-indigo-900/20")

# Move "Lectura Actual" to Col 1 directly inside.
lectura_start_marker = '{/* Lectura Actual */}'
lectura_start_idx = code.find(lectura_start_marker)
if lectura_start_idx != -1:
    # Find the end of Lectura Actual
    # It ends with <BookOpen ... /> </div> )} </div>
    lectura_end_idx = code.find('          </div>\n        </div>\n\n        {/* ── COL 3', lectura_start_idx)
    # The actual end is the closing div of "Lectura Actual"
    # To be safe, find the exact closing tag.
    # It's `<button ... text-emerald-300">+ Agregar libro</button>\n              </div>\n            )}\n          </div>`
    end_str = '+ Agregar libro</button>\n              </div>\n            )}\n          </div>'
    res = code.find(end_str, lectura_start_idx)
    if res != -1:
        lectura_end = res + len(end_str) + 1
        lectura_chunk = code[lectura_start_idx:lectura_end]

        # Remove Lectura Actual from Col 2
        code = code[:lectura_start_idx] + code[lectura_end:]

        # Find Col 1 end
        col1_end_str = '              })}\n            </div>\n          </div>'
        col1_end_idx = code.find(col1_end_str)
        if col1_end_idx != -1:
            col1_end = col1_end_idx + len(col1_end_str)
            
            # Wrap Col 1 & inject Lectura Actual
            col1_content = code[code.find('{/* ── COL 1: Tesla Morning ── */}'):col1_end]
            
            wrapped = f"""{{/* ── COL 1: Tesla Morning + Lectura ── */}}
        <div className="flex flex-col gap-5">
{col1_content.replace('{/* ── COL 1: Tesla Morning ── */}\\n', '')}
          {lectura_chunk}
        </div>"""
            code = code[:code.find('{/* ── COL 1')] + wrapped + code[col1_end:]


with open('src/components/Tabs/DashboardTab.jsx', 'w', encoding='utf-8') as f:
    f.write(code)

print("Modificaciones listas!")
