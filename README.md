> [한국어](README.ko.md) | **English**

# 💫 KNO: Korean Neologism Observatory
- 🔭 [Go to the Korean Neologism Observatory](https://korneo.github.io/KNO/) · [English edition](https://korneo.github.io/KNO/en/)

## 1. Overview

![KNO](/docs/img/KNO.png)

KNO (Korean Neologism Observatory) is a system that collects and analyzes newly emerging Korean words and expressions on a monthly basis, and observes and publishes their usage patterns.

Running since January 2025, it tracks newly appearing neologisms each month and provides quantitative indicators such as frequency, distribution, media sources, and speakers.

> **Note on language:** The platform interface is available in English, but the neologisms themselves — headwords, usage examples, and source texts — are kept in Korean, as they are the object of study.

---

## 2. Collection status
- Latest Update: 2026.07.21.

| Period | Candidate items | Final neologisms |
|------|---|---|
| Jan 2025 | 5,735,837 | 78 |
| Feb 2025 | 5,711,551 | 66 |
| Mar 2025 | 5,702,806 | 58 |
| Apr 2025 | 5,714,002 | 68 |
| May 2025 | 5,623,687 | 57 |
| Jun 2025 | 5,564,883 | 53 |
| Jul 2025 | 5,730,079 | 58 |
| Aug 2025 | 5,627,130 | 52 |
| Sep 2025 | 5,652,049 | 62 |
| Oct 2025 | 5,749,142 | 53 |
| Nov 2025 | 5,631,832 | 43 |
| Dec 2025 | 5,571,185 | 57 |
| **Total** | **68,014,183** | **705** |

---

## 3. Collection and analysis pipeline

![Korean Neologism Extraction Pipeline](/docs/img/Korean_Neologism_Extraction_Pipeline.png)

| Module | Function |
|------|---------|
| [Module 1] | Large-scale corpus collection |
| [Module 2] | Candidate extraction |
| [Module 3] | Candidate filtering |
| [Module 4] | LLM-assisted adjudication |
| [Module 5] | LLM-assisted entry writing |
| [Module 6] | Usage observation (frequency, distribution, number of speakers, etc.) |

---

## 4. References

*(Korean-language publications; titles kept in the original.)*

- [안진산·송현주·최준·현영희·이수진·백미경·남길임(2026), 「'한국어 신어 관측 시스템'의 개발과 활용」, 『한국사전학』 제47호.](https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART003344011)
- [안진산(2026ㄱ), 「실시간 신어 추출 파이프라인의 설계와 검증」, 『한글』 제87권 제1호.](https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART003317307)
- [안진산(2026ㄴ), 「거대언어모델을 활용한 신어 집필의 가능성과 쟁점」, 『한말연구』 제67권.](https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART003313231)
- [남길임·안진산·이수진(2025), 「말뭉치, LLMs, 인간 전문가의 협업을 통한 한국어 신어의 탐지」, 『한국어학』 108호.](https://www.kci.go.kr/kciportal/ci/sereArticleSearch/ciSereArtiView.kci?sereArticleSearchBean.artiId=ART003232209)
- [남길임 외(2025), 『신어 2024』, 한국문화사.](https://product.kyobobook.co.kr/detail/S000218853741)
- [남길임 외(2024), 『신어 2023』, 한국문화사.](https://product.kyobobook.co.kr/detail/S000215101540)
- [남길임 외(2023), 『신어 2022』, 한국문화사.](https://product.kyobobook.co.kr/detail/S000211731664)
- [남길임 외(2022), 『신어 2021』, 한국문화사.](https://product.kyobobook.co.kr/detail/S000200563843)
- [남길임 외(2021), 『신어 2020』, 한국문화사.](https://product.kyobobook.co.kr/detail/S000001848151)

---

## 🧑‍🏫 Core contributors

- **남길임 (Kilim Nam)**<br>
  Professor, Dept. of Korean Language and Literature, Yonsei University<br>
  📧 nki@yonsei.ac.kr

- **이수진 (Sujin Lee)**<br>
  Adjunct Professor, Dept. of Korean Language and Literature | Senior Researcher, Center for Linguistic Informatics, Kyungpook National University<br>
  📧 sjmano27@knu.ac.kr

- **안진산 (Jinsan An)**<br>
  Adjunct Professor, Dept. of Korean Language and Literature | Researcher, Center for Linguistic Informatics, Kyungpook National University<br>
  📧 san@knu.ac.kr

- **The survey of Korean neologisms since 2020** has been carried out by **the research team of Prof. Kilim Nam at Yonsei University** and **the Center for Linguistic Informatics at Kyungpook National University**.<br>
🔗 [Center for Linguistic Informatics, Kyungpook National University](https://home.knu.ac.kr/HOME/corpus/)

---

## 🙇‍♂️ Contributors

The following experts have contributed to the survey of Korean neologisms since 2020.

- 송현주 (Professor, Dept. of Korean Language Education, Kyungpook National University)
- 최 준 (Professor, Dept. of Korean Language and Literature, Chonnam National University)
- 현영희 (Adjunct Professor, Dept. of Korean Language and Literature, Kyungpook National University)
- 서은영 (Adjunct Professor, Dept. of Korean Language and Literature, Kyungpook National University)
- 백미경 (Adjunct Professor, Dept. of Korean Language and Literature, Kyungpook National University)
- 강범일 (Research Professor, Institute of Language and Information Studies, Yonsei University)
- 고예린 (PhD student, Dept. of Korean Language and Literature, Chonnam National University)
- 성민규 (PhD student, Dept. of Korean Language and Literature, Yonsei University)
- 정희윤 (Researcher, NHN)
- 김해은 (Researcher, National Institute of the Korean Language)
- 이 준 (MA student, Dept. of Korean Language and Literature, Yonsei University)
- 남궁설 (MA student, Dept. of Korean Language and Literature, Yonsei University)

We are deeply grateful to all our contributors.
