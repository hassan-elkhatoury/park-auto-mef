from __future__ import annotations

import argparse
import re
import shutil
from dataclasses import dataclass
from pathlib import Path
from zipfile import ZipFile

from docx import Document
from docx.oxml.ns import qn
from docx.oxml.table import CT_Tbl
from docx.oxml.text.paragraph import CT_P
from docx.table import Table
from docx.text.paragraph import Paragraph


FIGURE_RE = re.compile(r"^Figure\s+(\d+)\s*[-–:]\s*(.+)$", re.I)
TABLE_RE = re.compile(r"^(?:Table|Tableau)\s+(\d+)\s*[-–:]\s*(.+)$", re.I)
NUMBER_PREFIX_RE = re.compile(r"^\s*\d+(?:\.\d+)*\.?\s*")


@dataclass
class BodyElement:
    kind: str
    value: Paragraph | Table


def latex_escape(text: str) -> str:
    replacements = {
        "\\": r"\textbackslash{}",
        "&": r"\&",
        "%": r"\%",
        "$": r"\$",
        "#": r"\#",
        "_": r"\_\allowbreak{}",
        "{": r"\{",
        "}": r"\}",
        "~": r"\textasciitilde{}",
        "^": r"\textasciicircum{}",
    }
    return "".join(replacements.get(char, char) for char in text)


def run_to_tex(run) -> str:
    text = latex_escape(run.text)
    if not text:
        return ""
    if run.bold:
        text = rf"\textbf{{{text}}}"
    if run.italic:
        text = rf"\emph{{{text}}}"
    color = None
    try:
        if run.font.color and run.font.color.rgb:
            color = str(run.font.color.rgb)
    except Exception:
        color = None
    if color and color not in {"000000", "252525", "202733"}:
        text = rf"\textcolor[HTML]{{{color}}}{{{text}}}"
    return text


def paragraph_to_tex(paragraph: Paragraph) -> str:
    if paragraph.runs:
        content = "".join(run_to_tex(run) for run in paragraph.runs)
    else:
        content = latex_escape(paragraph.text)
    content = content.replace("\n", r"\newline{} ")
    return content.strip()


def strip_number_prefix(text: str) -> str:
    return NUMBER_PREFIX_RE.sub("", text).strip()


def iter_body(document: Document) -> list[BodyElement]:
    elements: list[BodyElement] = []
    for child in document.element.body.iterchildren():
        if isinstance(child, CT_P):
            elements.append(BodyElement("paragraph", Paragraph(child, document)))
        elif isinstance(child, CT_Tbl):
            elements.append(BodyElement("table", Table(child, document)))
    return elements


def image_targets(paragraph: Paragraph, document: Document) -> list[str]:
    targets: list[str] = []
    for blip in paragraph._p.xpath(".//a:blip"):
        rid = blip.get(qn("r:embed"))
        if rid and rid in document.part.rels:
            targets.append(document.part.rels[rid].target_ref.replace("\\", "/"))
    return targets


def has_numbering(paragraph: Paragraph) -> bool:
    ppr = paragraph._p.pPr
    return bool(ppr is not None and ppr.numPr is not None)


def media_tex_path(target: str) -> str:
    return "figures/media/" + Path(target).name


def caption_parts(text: str, kind: str) -> tuple[int | None, str]:
    match = FIGURE_RE.match(text.strip()) if kind == "figure" else TABLE_RE.match(text.strip())
    if not match:
        return None, text.strip()
    return int(match.group(1)), match.group(2).strip()


def table_to_tex(table: Table, caption: str | None, label: str | None) -> str:
    rows = [[cell.text.strip() for cell in row.cells] for row in table.rows]
    if not rows:
        return ""
    col_count = max(len(row) for row in rows)
    spec = "|" + "|".join([r">{\raggedright\arraybackslash}X"] * col_count) + "|"
    output = [r"\begin{table}[H]", r"\centering", r"\footnotesize"]
    if caption:
        output.append(rf"\caption{{{latex_escape(caption)}}}")
    if label:
        output.append(rf"\label{{{label}}}")
    output.extend(
        [
            r"\arrayrulecolor{reportborder}",
            rf"\begin{{tabularx}}{{\textwidth}}{{{spec}}}",
            r"\hline",
        ]
    )
    for row_index, row in enumerate(rows):
        padded = row + [""] * (col_count - len(row))
        cells = []
        for value in padded:
            value = latex_escape(value).replace("\n", r"\newline{} ")
            if row_index == 0:
                value = rf"\textcolor{{white}}{{\textbf{{{value}}}}}"
            cells.append(value)
        if row_index == 0:
            output.append(r"\rowcolor{reportnavy}")
        elif row_index % 2 == 0:
            output.append(r"\rowcolor{reportlight}")
        output.append(" & ".join(cells) + r" \\ \hline")
    output.extend([r"\end{tabularx}", r"\end{table}", ""])
    return "\n".join(output)


def simple_table_to_tex(table: Table) -> str:
    rows = [[cell.text.strip() for cell in row.cells] for row in table.rows]
    output = [r"\begin{center}", r"\small", r"\begin{longtable}{|p{0.22\textwidth}|p{0.66\textwidth}|}", r"\hline"]
    for idx, row in enumerate(rows):
        left = latex_escape(row[0] if row else "")
        right = latex_escape(row[1] if len(row) > 1 else "")
        if idx == 0:
            output.append(r"\rowcolor{reportlight}\textbf{" + left + r"} & \textbf{" + right + r"} \\ \hline")
        else:
            output.append(left + " & " + right + r" \\ \hline")
    output.extend([r"\end{longtable}", r"\end{center}"])
    return "\n".join(output)


def paragraph_alignment_wrapper(paragraph: Paragraph, content: str) -> str:
    alignment = paragraph.alignment
    if alignment is not None and str(alignment).endswith("CENTER (1)"):
        return rf"\begin{{center}}{content}\end{{center}}"
    if alignment is not None and str(alignment).endswith("RIGHT (2)"):
        return rf"\begin{{flushright}}{content}\end{{flushright}}"
    return content


def render_figure(file_path: str | None, caption: str, label: str, width: str = r"0.94\textwidth") -> str:
    lines = [r"\begin{figure}[H]", r"\centering"]
    if file_path:
        lines.append(
            rf"\IfFileExists{{{file_path}}}{{\includegraphics[width={width},height=0.73\textheight,keepaspectratio]{{{file_path}}}}}{{\vspace{{0.2em}}}}"
        )
    lines.extend(
        [
            rf"\caption{{{latex_escape(caption)}}}",
            rf"\label{{{label}}}",
            r"\end{figure}",
            "",
        ]
    )
    return "\n".join(lines)


def render_inline_image(file_path: str, content: str) -> str:
    return "\n".join(
        [
            r"\noindent\begin{minipage}{\textwidth}",
            rf"\includegraphics[height=0.46cm,keepaspectratio]{{{file_path}}}\hspace{{0.45em}}{content}",
            r"\end{minipage}\par",
        ]
    )


def find_range(elements: list[BodyElement], starts_with: str) -> int:
    for index, element in enumerate(elements):
        if element.kind == "paragraph" and element.value.text.strip().startswith(starts_with):
            return index
    raise ValueError(f"Heading not found: {starts_with}")


def external_figure_map() -> dict[int, str]:
    return {
        13: "figures/chapter3/CH3_Asset_05_UseCase_Securite.png",
        14: "figures/chapter3/CH3_Asset_06_Classes_Securite.png",
        15: "figures/chapter3/CH3_Asset_07_Sequence_Login_JWT.png",
    }


def render_chapter(elements: list[BodyElement], document: Document, chapter_number: int) -> str:
    output: list[str] = []
    pending_image: str | None = None
    pending_table_caption: tuple[int | None, str] | None = None
    list_open = False
    figure_map = external_figure_map() if chapter_number == 3 else {}

    def close_list() -> None:
        nonlocal list_open
        if list_open:
            output.extend([r"\end{itemize}", ""])
            list_open = False

    index = 0
    while index < len(elements):
        element = elements[index]
        if element.kind == "table":
            close_list()
            caption_data = pending_table_caption
            pending_table_caption = None
            if caption_data is None and index + 1 < len(elements):
                next_element = elements[index + 1]
                if next_element.kind == "paragraph":
                    next_text = " ".join(next_element.value.text.split())
                    next_match = TABLE_RE.match(next_text)
                    if next_match:
                        caption_data = (int(next_match.group(1)), next_match.group(2).strip())
                        index += 1
            number, caption = caption_data if caption_data else (None, None)
            label = f"tab:{number}" if number else None
            output.append(table_to_tex(element.value, caption, label))
            index += 1
            continue

        paragraph = element.value
        text = " ".join(paragraph.text.split())
        style = paragraph.style.name if paragraph.style else "Normal"
        targets = image_targets(paragraph, document)

        if targets:
            close_list()
            file_path = media_tex_path(targets[0])
            if text:
                output.extend([render_inline_image(file_path, paragraph_to_tex(paragraph)), ""])
            else:
                pending_image = file_path
            index += 1
            continue

        table_match = TABLE_RE.match(text)
        figure_match = FIGURE_RE.match(text)
        if table_match:
            close_list()
            pending_table_caption = (int(table_match.group(1)), table_match.group(2).strip())
            index += 1
            continue
        if figure_match:
            close_list()
            number = int(figure_match.group(1))
            caption = figure_match.group(2).strip()
            file_path = figure_map.get(number) or pending_image
            pending_image = None
            output.append(render_figure(file_path, caption, f"fig:{number}"))
            index += 1
            continue

        if style.startswith("Heading"):
            close_list()
            if not text:
                index += 1
                continue
            clean = strip_number_prefix(text)
            if chapter_number in {1, 2}:
                if style == "Heading 3":
                    output.extend([rf"\section{{{latex_escape(clean)}}}", ""])
                elif style == "Heading 4":
                    output.extend([rf"\subsection{{{latex_escape(clean)}}}", ""])
                elif style == "Heading 5":
                    output.extend([rf"\subsubsection{{{latex_escape(clean)}}}", ""])
                else:
                    output.extend([rf"\paragraph{{{latex_escape(clean)}}}", ""])
            else:
                if clean == "Socle technique et architecture globale":
                    output.extend([rf"\section{{{latex_escape(clean)}}}", ""])
                elif clean == "Stack technologique":
                    output.extend([rf"\subsection{{{latex_escape(clean)}}}", ""])
                elif style == "Heading 2":
                    output.extend([rf"\section{{{latex_escape(clean)}}}", ""])
                elif style == "Heading 3":
                    output.extend([rf"\subsection{{{latex_escape(clean)}}}", ""])
                elif style == "Heading 4":
                    if re.match(r"^[A-C]\.\s*", text):
                        output.extend([rf"\subsubsection*{{{latex_escape(text)}}}", ""])
                    else:
                        output.extend([rf"\subsubsection{{{latex_escape(clean)}}}", ""])
                else:
                    output.extend([rf"\paragraph{{{latex_escape(clean)}}}", ""])
            index += 1
            continue

        is_list = has_numbering(paragraph) or text.startswith(("•", "", "✓"))
        if is_list:
            if not list_open:
                output.append(r"\begin{itemize}")
                list_open = True
            cleaned = text.lstrip("•✓ ")
            output.append(rf"\item {latex_escape(cleaned)}")
            index += 1
            continue

        close_list()
        if text:
            content = paragraph_to_tex(paragraph)
            output.extend([paragraph_alignment_wrapper(paragraph, content), ""])
        index += 1

    close_list()
    return "\n".join(output).strip() + "\n"


def preamble_tex() -> str:
    return r"""\documentclass[12pt,a4paper]{report}
\usepackage{fontspec}
\usepackage[french]{babel}
\IfFontExistsTF{Times New Roman}{\setmainfont{Times New Roman}}{\setmainfont{Latin Modern Roman}}
\IfFontExistsTF{Arial}{\setsansfont{Arial}}{\setsansfont{Latin Modern Sans}}
\usepackage[a4paper,left=2.25cm,right=1.25cm,top=2.25cm,bottom=1.35cm,headheight=14pt]{geometry}
\usepackage{microtype}
\usepackage{graphicx}
\usepackage[table]{xcolor}
\usepackage{array}
\usepackage{tabularx}
\usepackage{longtable}
\usepackage{booktabs}
\usepackage{float}
\usepackage{caption}
\usepackage{subcaption}
\usepackage{titlesec}
\usepackage{enumitem}
\usepackage{fancyhdr}
\usepackage{hyperref}
\usepackage{amsmath}
\usepackage{tcolorbox}
\usepackage{chngcntr}

\definecolor{reportblue}{HTML}{1F487C}
\definecolor{reportnavy}{HTML}{0B2545}
\definecolor{reportteal}{HTML}{1597A8}
\definecolor{reportgold}{HTML}{C7922F}
\definecolor{reportgray}{HTML}{667085}
\definecolor{reportlight}{HTML}{F3F6FA}
\definecolor{reportborder}{HTML}{B8C9DC}

\hypersetup{colorlinks=true,linkcolor=reportblue,urlcolor=reportblue,citecolor=reportblue,pdfauthor={EL KHATOURY Hassan},pdftitle={Rapport PFA - Gestion du Parc Automobile MEF}}
\setlength{\parindent}{0.52cm}
\setlength{\parskip}{0.18em}
\setlength{\emergencystretch}{3em}
\linespread{1.08}
\setlist[itemize]{leftmargin=1.0cm,itemsep=0.08em,topsep=0.15em,label=\textbullet}
\setcounter{tocdepth}{3}
\setcounter{secnumdepth}{3}
\counterwithout{figure}{chapter}
\counterwithout{table}{chapter}

\pagestyle{fancy}
\fancyhf{}
\fancyfoot[C]{\thepage}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}

\titleformat{\chapter}[hang]
  {\centering\bfseries\itshape\color{reportblue}\fontsize{20}{24}\selectfont}
  {Chapitre \thechapter:}{0.45em}{}
\titlespacing*{\chapter}{0pt}{-1.0em}{1.5em}
\titleformat{\section}{\bfseries\fontsize{16}{19}\selectfont}{\thesection.}{0.45em}{}
\titlespacing*{\section}{0pt}{1.0em}{0.3em}
\titleformat{\subsection}{\bfseries\fontsize{13.5}{16}\selectfont}{\thesubsection.}{0.4em}{}
\titlespacing*{\subsection}{0pt}{0.7em}{0.2em}
\titleformat{\subsubsection}{\bfseries\fontsize{12}{14}\selectfont}{\thesubsubsection.}{0.35em}{}

\captionsetup{font={small,it},labelfont=it,textfont={it,color=reportgray},justification=centering,singlelinecheck=false}
\renewcommand{\contentsname}{Table des matières}
\renewcommand{\listfigurename}{Liste des figures}
\renewcommand{\listtablename}{Liste des tableaux}
\renewcommand{\figurename}{Figure}
\renewcommand{\tablename}{Tableau}

\newcommand{\localnumbering}{%
  \renewcommand{\thesection}{\arabic{section}}%
  \renewcommand{\thesubsection}{\thesection.\arabic{subsection}}%
  \renewcommand{\thesubsubsection}{\thesubsection.\arabic{subsubsection}}}
\newcommand{\chapternumbering}{%
  \renewcommand{\thesection}{\thechapter.\arabic{section}}%
  \renewcommand{\thesubsection}{\thesection.\arabic{subsection}}%
  \renewcommand{\thesubsubsection}{\thesubsection.\arabic{subsubsection}}}

\newtcolorbox{chapterroadmap}{colback=reportlight,colframe=reportblue,boxrule=0.7pt,arc=1mm,left=3mm,right=3mm,top=2mm,bottom=2mm}
"""


def main_tex() -> str:
    return r"""\input{config/preamble}
\begin{document}
\input{frontmatter/cover}
\setcounter{page}{2}
\input{frontmatter/dedicace}
\input{frontmatter/remerciement}
\input{frontmatter/resume}
\clearpage
\tableofcontents
\clearpage
\listoftables
\addcontentsline{toc}{chapter}{Liste des tableaux}
\clearpage
\listoffigures
\addcontentsline{toc}{chapter}{Liste des figures}
\clearpage
\input{frontmatter/abreviations}
\clearpage
\chapter*{Introduction générale}
\addcontentsline{toc}{chapter}{Introduction générale}
\clearpage
\input{chapters/chapter1}
\input{chapters/chapter2}
\input{chapters/chapter3}
\end{document}
"""


def cover_tex() -> str:
    return r"""\begin{titlepage}
\thispagestyle{empty}
\begin{minipage}[t]{0.22\textwidth}
\includegraphics[width=\linewidth]{figures/media/image1.png}
\end{minipage}\hfill
\begin{minipage}[t]{0.53\textwidth}
\centering\itshape\fontsize{15}{19}\selectfont
Université Abdelmalek Essaâdi\\
École Nationale des Sciences Appliquées\\
Al Hoceima
\end{minipage}\hfill
\begin{minipage}[t]{0.18\textwidth}
\raggedleft\includegraphics[width=\linewidth]{figures/media/image2.jpeg}
\end{minipage}

\vspace{1.6cm}
\begin{flushright}\textcolor{reportblue}{\bfseries\itshape N\textsuperscript{o} d'ordre :}\end{flushright}
\vspace{0.7cm}

\begin{center}
{\bfseries\itshape\fontsize{24}{29}\selectfont Rapport de Projet de Fin d'Année (PFA)}

\vspace{1.2cm}
{\textcolor{reportblue}{\bfseries\itshape Filière:} \itshape Génie Informatique}

\vspace{1.4cm}
{\bfseries\itshape\fontsize{21}{25}\selectfont
Développement d'une API REST de Gestion du\\
Parc Automobile du Ministère de l'Économie et\\
des Finances (MEF)}

\vspace{1.6cm}
{\textcolor{reportblue}{\bfseries\itshape Réalisé par}}\\[0.35cm]
{\itshape EL KHATOURY Hassan}

\vspace{0.9cm}
{\textcolor{reportblue}{\bfseries\itshape Encadré par}}\\[0.35cm]
{\itshape M. ELKAOUMI Aimad (Direction du Budget -- MEF)}

\vfill
{\bfseries\itshape Année Universitaire : 2026/2027}
\end{center}
\end{titlepage}
"""


def empty_frontmatter(title: str) -> str:
    return rf"""\clearpage
\chapter*{{{title}}}
\addcontentsline{{toc}}{{chapter}}{{{title}}}
\vfill
"""


def chapter3_prefix() -> str:
    return r"""\chapter{Architecture, conception et réalisation}
\chapternumbering
\begin{chapterroadmap}
\textbf{Organisation du chapitre.} La conception est présentée selon six blocs cohérents : socle technique et architecture, sécurité et habilitations, gestion du parc, conducteurs et missions, exploitation carburant/maintenance, puis risques et pilotage budgétaire. Cette progression relie les besoins fonctionnels aux modèles UML, aux données et aux interfaces React.
\end{chapterroadmap}
\vspace{0.5em}
"""


def compact_chapter3_tail(content: str) -> str:
    first = render_figure(None, "Interface de suivi des dossiers de sinistres", "fig:31")
    second = render_figure(None, "Tableau de bord de suivi budgétaire", "fig:32")
    combined = r"""\begin{figure}[H]
\centering
\captionsetup{skip=2pt}
\caption{Interface de suivi des dossiers de sinistres}
\label{fig:31}
\vspace{-0.35em}
\caption{Tableau de bord de suivi budgétaire}
\label{fig:32}
\end{figure}
"""
    return content.replace(first + "\n" + second, combined)


def chapter_wrapper(number: int, title: str, content: str) -> str:
    numbering = r"\chapternumbering" if number == 3 else r"\localnumbering"
    return f"\\chapter{{{latex_escape(title)}}}\n{numbering}\n{content}"


def extract_media(source: Path, output_dir: Path) -> None:
    media_dir = output_dir / "figures" / "media"
    media_dir.mkdir(parents=True, exist_ok=True)
    with ZipFile(source) as archive:
        for name in archive.namelist():
            if name.startswith("word/media/") and not name.endswith("/"):
                target = media_dir / Path(name).name
                with archive.open(name) as src, target.open("wb") as dst:
                    shutil.copyfileobj(src, dst)


def copy_chapter3_assets(workspace: Path, output_dir: Path) -> None:
    target_dir = output_dir / "figures" / "chapter3"
    target_dir.mkdir(parents=True, exist_ok=True)
    source_dir = workspace / "assets" / "chapter3" / "rendered"
    for name in [
        "CH3_Asset_05_UseCase_Securite.png",
        "CH3_Asset_06_Classes_Securite.png",
        "CH3_Asset_07_Sequence_Login_JWT.png",
        "CH3_Asset_08_Sequence_Refresh_Token.png",
        "CH3_Asset_09_Sequence_Changement_MDP.png",
    ]:
        source = source_dir / name
        if source.exists():
            shutil.copy2(source, target_dir / name)


def build(source: Path, output: Path) -> None:
    output.mkdir(parents=True, exist_ok=True)
    for folder in ["config", "frontmatter", "chapters", "figures/media", "figures/chapter3"]:
        (output / folder).mkdir(parents=True, exist_ok=True)

    document = Document(source)
    elements = iter_body(document)
    chapter1_index = find_range(elements, "Chapitre 1")
    chapter2_index = find_range(elements, "Chapitre 2")
    chapter3_index = find_range(elements, "Chapitre 3")

    chapter1 = render_chapter(elements[chapter1_index + 1 : chapter2_index], document, 1)
    chapter2 = render_chapter(elements[chapter2_index + 1 : chapter3_index], document, 2)
    chapter3 = render_chapter(elements[chapter3_index + 1 :], document, 3)

    abbreviations = simple_table_to_tex(document.tables[0])
    extract_media(source, output)
    copy_chapter3_assets(source.parent, output)

    files = {
        "main.tex": main_tex(),
        "config/preamble.tex": preamble_tex(),
        "frontmatter/cover.tex": cover_tex(),
        "frontmatter/dedicace.tex": empty_frontmatter("Dédicace"),
        "frontmatter/remerciement.tex": empty_frontmatter("Remerciement"),
        "frontmatter/resume.tex": empty_frontmatter("Résumé"),
        "frontmatter/abreviations.tex": "\\chapter*{Liste des abréviations}\n\\addcontentsline{toc}{chapter}{Liste des abréviations}\n" + abbreviations + "\n",
        "chapters/chapter1.tex": chapter_wrapper(1, "Contexte général et cadre de projet", chapter1),
        "chapters/chapter2.tex": chapter_wrapper(2, "Rappel Théorique et Concepts de Génie Logiciel", chapter2),
        "chapters/chapter3.tex": chapter3_prefix() + compact_chapter3_tail(chapter3),
        "README_OVERLEAF.md": """# Rapport PFA - Projet Overleaf\n\n1. Importer le contenu de ce dossier ou le fichier ZIP dans Overleaf.\n2. Sélectionner **XeLaTeX** comme compilateur.\n3. Définir `main.tex` comme document principal.\n4. Compiler deux fois pour actualiser la table des matières, la liste des tableaux et la liste des figures.\n\nLes figures absentes du DOCX source sont conservées comme légendes numérotées. Pour les compléter, déposer le fichier attendu dans `figures/chapter3/` et remplacer le chemin correspondant dans `chapters/chapter3.tex`.\n""",
    }
    for relative, content in files.items():
        path = output / relative
        path.write_text(content, encoding="utf-8", newline="\n")


def main() -> None:
    parser = argparse.ArgumentParser(description="Build an Overleaf-ready LaTeX project from the PFA DOCX report.")
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    build(args.source.resolve(), args.output.resolve())


if __name__ == "__main__":
    main()
