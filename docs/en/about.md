---
layout: default
title: About KNO
lang: en
alt_url: /about/
permalink: /en/about/
---

<div class="intro-header">
  <img src="{{ '/img/KNO.png' | relative_url }}" alt="KNO" class="intro-logo">
</div>

## Purpose of the project<br>
- This project aims to <span style="color:#1e3a8a; font-size:1.05em; font-weight:500;">collect and analyze Korean neologisms on a monthly basis and observe how they are used</span>.<br>
- Going further, as bodies such as the American Dialect Society and the *Oxford English Dictionary* do, we aim to select a <span style="color:#1e3a8a; font-size:1.05em; font-weight:500;">'Word of the Year'</span> based on quantitative and qualitative analysis.<br><br>

- State-led surveys of Korean neologisms have been conducted 22 times since *A Survey and Study of Neologisms* (National Institute of the Korean Language, 1994), and since 2020 the research team of Prof. Kilim Nam at Yonsei University and the Center for Linguistic Informatics at Kyungpook National University have compiled an annual neologism dictionary (Nam et al. 2021–2025). This project, too, builds on the methodology of Korean neologism surveys developed since 1994.<br><br>

- Making a dictionary is far harder work than one might think. Samuel Johnson, the 18th-century English poet and critic, remarked that <span style="color:#1e3a8a; font-size:1.05em; font-weight:500;">humankind treats lexicographers not as 'disciples of learning' but as its 'slaves,'</span> calling himself a 'humble drudge'; together with six assistants, over 8 years and 10 months, he completed an English dictionary of some 42,000 headwords. Even then, he had to confess in his preface that "to enchain syllables, and to lash the wind, are equally the undertakings of pride" (Johnson 1755/2004). Two hundred and seventy years on, little has changed: compiling a dictionary — a neologism dictionary above all — demands enormous time, cost, and labor.<br><br>

- In response, this project designed and developed a <span style="color:#1e3a8a; font-size:1.05em; font-weight:500;">neologism collection–analysis pipeline based on the methodological triangulation of 'corpora,' 'large language models,' and 'lexicographic experts'</span> in order to observe the dynamism of the Korean lexicon. The goal is to raise the productivity, efficiency, and accuracy of neologism surveys while securing the reproducibility and falsifiability of corpus-based language research (An 2026a).<br><br>

<img src="{{ '/img/Korean_Neologism_Extraction_Pipeline.png' | relative_url }}" alt="Pipeline" style="max-width:60%;">

- The hopes and concerns surrounding LLM-assisted lexicography are both, in part, well founded. Some expect gains in productivity and efficiency, while others voice concerns over technical limits such as hallucination, as well as non-determinism and ethical issues.<br><br>

## First question: can an LLM identify neologisms?<br>

- Nam, An & Lee (2025) used an LLM to expand the 'existing neologism list (325 items)' of *Sineo 2023* into an 'extended list (368 items)', an increase of about 13%. In effect, the LLM found 43 additional neologisms that humans had missed. Of course, LLMs are not perfect either — they sometimes misjudge a neologism as a non-neologism, or vice versa.<br><br>

<table style="font-size:0.85rem; max-width:600px; margin:0 auto;">
<thead>
<tr><th style="text-align:center;">Task</th><th style="text-align:center;">Candidates</th><th style="text-align:center;">TP</th><th style="text-align:center;">FN</th><th style="text-align:center;">FP</th><th style="text-align:center;">TN</th><th style="text-align:center;">F1</th></tr>
</thead>
<tbody>
<tr><td>First-pass screening (human)</td><td style="text-align:right;">6,301</td><td style="text-align:right;">91</td><td style="text-align:right;">43</td><td style="text-align:right;">0</td><td style="text-align:right;">6,167</td><td style="text-align:right;">0.80899</td></tr>
<tr><td>First-pass screening (GPT-4o)</td><td style="text-align:right;">6,301</td><td style="text-align:right;">85</td><td style="text-align:right;">49</td><td style="text-align:right;">288</td><td style="text-align:right;">5,879</td><td style="text-align:right;">0.33516</td></tr>
<tr><td>Final adjudication (human)</td><td style="text-align:right;">-</td><td style="text-align:right;">134</td><td style="text-align:right;">-</td><td style="text-align:right;">-</td><td style="text-align:right;">-</td><td style="text-align:right;">-</td></tr>
<tr><td>Additional collection (paradigmatic words, etc.)</td><td style="text-align:right;">368<br>(+234)</td><td style="text-align:right;">-</td><td style="text-align:right;">-</td><td style="text-align:right;">-</td><td style="text-align:right;">-</td></tr>
</tbody>
</table>
<br>
<br>

## Second question: can an LLM write neologism entries?<br>

- An (2026b) presents experimental results on this question.<br>

<img src="{{ '/img/example_1.png' | relative_url }}" alt="Scatter plot" style="max-width:60%;">

- **Type 1** (upper right) comprises items where the human and LLM definitions match almost exactly, both formally and semantically. '절싫중떠' (a contraction of the saying "if you dislike the temple, it is the monk who should leave") is a representative case. **Type 3** (upper left), which accounts for over 70% of all items, covers cases where the wording differs but the intended meaning aligns. For '한일믹스어' (Korean–Japanese mix-language), for instance, the human glossed it succinctly as "a mixture of Korean and Japanese," whereas the LLM tended to add extra information, e.g., "a language made by mixing the vocabulary or expressions of Korean and Japanese." The LLM also struggles to resolve ambiguity in words formed by complex morphological mechanisms such as clipping and post-clipping compounding — glossing '깊털' (skimming gift certificates, from 기프티콘 털어 먹기) as "a contraction of '깊은 털이 (deep theft)'," for example. **Type 4** (lower left) is where the LLM's limits show most clearly. A representative hallucination: for '티모시 증후군' (Timothy syndrome, a rare disorder caused by a calcium-channel defect in brain neurons), it mistook the personal name 'Timothy' for the actor 'Timothée Chalamet' and produced an entirely wrong gloss (a psychological state of excessively imitating a person's speech, behavior, or dress to become like them).<br><br>

## The core question, in the end, is this.
- **How can Type 4 errors be lifted to Type 3, and further to Type 1?**<br>

<img src="{{ '/img/example_2.png' | relative_url }}" alt="Change in similarity distribution" style="max-width:80%;">

- The answer lies in reliable reference material. When high-quality text data containing the emergence context of a neologism is provided together with an existing &lt;neologism DB&gt;, the LLM's formal similarity rises by +0.044 and its semantic similarity by +0.081, both significant (p<.001). Reference material alone, however, does not eliminate every error — mistakes like 'Timothée Chalamet' can still occur. <span style="color:#1e3a8a; font-size:1.05em; font-weight:500;">This is precisely why the lexicographer stands at the final gate of this pipeline.</span>
<br>
<br>
<hr>
<br>
- This pipeline has been running monthly since January 2025, collecting and analyzing newly emerging Korean neologisms each month and publishing the results through this repository.<br><br>

- Have you come across a new word?<br>
- If you report it through the link below, we will observe how it is used and publish the results here.<br><br>

**[Report a Korean neologism](https://forms.gle/dDyAAq2G36aEEj5q9)**<br><br>

**Contact**: Jinsan An, Center for Linguistic Informatics, Kyungpook National University ([koreanneology@gmail.com](mailto:koreanneology@gmail.com))
<br>
<br>
<hr>
<br>
### References

- [안진산·송현주·최준·현영희·이수진·백미경·남길임(2026), 「한국어 신어 관측 시스템의 개발과 활용」, 『한국사전학』 제47호.](https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART003344011)
- [안진산(2026ㄱ), 「실시간 신어 추출 파이프라인의 설계와 검증」, 『한글』 제87권 제1호.](https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART003317307)
- [안진산(2026ㄴ), 「거대언어모델을 활용한 신어 집필의 가능성과 쟁점」, 『한말연구』 제67권.](https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART003313231)
- [남길임·안진산·이수진(2025), 「말뭉치, LLMs, 인간 전문가의 협업을 통한 한국어 신어의 탐지」, 『한국어학』 108호.](https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART003232209)
- [남길임 외(2025), 『신어 2024』, 한국문화사.](https://product.kyobobook.co.kr/detail/S000218853741)
- [남길임 외(2024), 『신어 2023』, 한국문화사.](https://product.kyobobook.co.kr/detail/S000215101540)
- [남길임 외(2023), 『신어 2022』, 한국문화사.](https://product.kyobobook.co.kr/detail/S000211731664)
- [남길임 외(2022), 『신어 2021』, 한국문화사.](https://product.kyobobook.co.kr/detail/S000200563843)
- [남길임 외(2021), 『신어 2020』, 한국문화사.](https://product.kyobobook.co.kr/detail/S000001848151)
- [Johnson, S. (1755/2004). Preface to a dictionary of the English language., *Project Gutenberg*](https://www.gutenberg.org/ebooks/5430)
<br>
<br>
<hr>
<br>
## Core contributors

- **남길임 (Kilim Nam)**<br>
  Professor, Dept. of Korean Language and Literature, Yonsei University<br>
  nki@yonsei.ac.kr

- **이수진 (Sujin Lee)**<br>
  Adjunct Professor, Dept. of Korean Language and Literature | Senior Researcher, Center for Linguistic Informatics, Kyungpook National University<br>
  sjmano27@knu.ac.kr

- **안진산 (Jinsan An)**<br>
  Adjunct Professor, Dept. of Korean Language and Literature | Researcher, Center for Linguistic Informatics, Kyungpook National University<br>
  san@knu.ac.kr

- **The survey of Korean neologisms since 2020** has been carried out by **the research team of Prof. Kilim Nam at Yonsei University** and **the Center for Linguistic Informatics at Kyungpook National University**.<br>
[Center for Linguistic Informatics, Kyungpook National University](https://home.knu.ac.kr/HOME/corpus/)
<br>
<br>
<hr>
<br>
## Contributors<br>
The following experts have contributed to the survey of Korean neologisms since 2020.<br><br>
- 송현주 (Professor, Dept. of Korean Language Education, Kyungpook National University)
- 최  준 (Professor, Dept. of Korean Language and Literature, Chonnam National University)
- 현영희 (Adjunct Professor, Dept. of Korean Language and Literature, Kyungpook National University)
- 서은영 (Adjunct Professor, Dept. of Korean Language and Literature, Kyungpook National University)
- 백미경 (Adjunct Professor, Dept. of Korean Language and Literature, Kyungpook National University)
- 강범일 (Research Professor, Institute of Language and Information Studies, Yonsei University)
- 고예린 (PhD student, Dept. of Korean Language and Literature, Chonnam National University)
- 성민규 (PhD student, Dept. of Korean Language and Literature, Yonsei University)
- 정희윤 (Researcher, NHN)
- 김해은 (Researcher, National Institute of the Korean Language)
- 이  준 (MA student, Dept. of Korean Language and Literature, Yonsei University)
- 남궁설 (MA student, Dept. of Korean Language and Literature, Yonsei University)
<br>
We are deeply grateful to all our contributors. 🙇‍♂️
