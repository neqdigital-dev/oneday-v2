import os

filepath = r'D:\Users\natan\Documentos\Phyton\oneday\oneday-v2\src\app\super-admin\times\page.tsx'
with open(filepath, 'r', encoding='utf-8') as f:
    text = f.read()

import_statement = "import TabsFilter from './TabsFilter';\n"
if "import TabsFilter" not in text:
    text = text.replace('import AdminActions from "./AdminActions";', 'import AdminActions from "./AdminActions";\n' + import_statement)

# Replace the table part
start_marker = '<div className="table-wrapper">'
end_marker = '</table>\n          </div>'
start_idx = text.find(start_marker)
end_idx = text.find(end_marker) + len(end_marker)

if start_idx != -1 and end_idx != -1:
    new_text = text[:start_idx] + '<TabsFilter times={data.times} />' + text[end_idx:]
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_text)
    print("Replaced successfully")
else:
    print("Could not find table section")
