import zipfile
import xml.etree.ElementTree as ET
import os

def docx_to_text(docx_path):
    try:
        # docx is a zip file
        with zipfile.ZipFile(docx_path) as z:
            # Main document content is in word/document.xml
            xml_content = z.read('word/document.xml')
            root = ET.fromstring(xml_content)
            
            # Namespace for Word processing ML
            namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            
            # Extract all text elements
            texts = []
            for elem in root.iter():
                if elem.tag.endswith('t'):
                    if elem.text:
                        texts.append(elem.text)
                elif elem.tag.endswith('p'):
                    texts.append('\n')
            
            # Join and format
            full_text = "".join(texts)
            # Remove double newlines
            return full_text
    except Exception as e:
        return f"Error reading docx: {str(e)}"

if __name__ == '__main__':
    docx_path = r'c:\Users\Mohamed\Documents\MES_PROJETS\SIRH\projet_SIRH.docx'
    output_path = r'c:\Users\Mohamed\Documents\MES_PROJETS\SIRH\doc_extracted\projet_SIRH_text.txt'
    
    text = docx_to_text(docx_path)
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(text)
    
    print("Docx text successfully extracted to", output_path)
