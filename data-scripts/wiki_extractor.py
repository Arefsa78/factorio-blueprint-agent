import json
from bs4 import BeautifulSoup
import requests
from wiki_db import WikiDB

LINKS_PATH = 'data-wiki/links.json'
PREFIX_URL = 'https://wiki.factorio.com/'

def extract_text_md(html):
    soup = BeautifulSoup(html, "html.parser")
    
    # find a div.infobox element
    soup = soup.find("div", class_="infobox")
    if not soup:
        return ""

    # Replace <a> tags with their title if present, else their text
    for a in soup.find_all("a"):
        if a.has_attr("title"):
            a.replace_with(a["title"])
        else:
            a.replace_with(a.get_text())

    # Find all table rows
    md_lines = []
    for tr in soup.find_all("tr"):
        cells = []
        for td in tr.find_all(["td", "th"]):
            text = td.get_text(separator=" ", strip=True)
            if text:
                cells.append(text)
        if cells:
            md_lines.append(f"- {' | '.join(cells)}")
    return "\n".join(md_lines)

# Load links:
with open(LINKS_PATH, 'r', encoding='utf-8') as f:
    links = json.load(f)

wiki_db = WikiDB()
wiki_db.initialize()

n_links = len(links)
for i, link in enumerate(links[168+25:]):
    print(f'\rProcessing {i+1}/{n_links}: {link["title"]}', end='', flush=True)
    # get content
    url = PREFIX_URL + link['link']
    # request and get html
    response = requests.get(url)
    if response.status_code == 200:
        html = response.text
        # extract text
        md_text = extract_text_md(html)
        if not md_text:
            print(f"\nNo content found for {link['title']}. Skipping.")
            continue
        # save to db and file
        wiki_db.add_wiki_page(link['title'], md_text)

wiki_db.close()