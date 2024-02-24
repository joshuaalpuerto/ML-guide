# Your travel buddy

## Description

A simple project that helps me navigate how to use Multi Agent process. This is a modified version of this example project from [CrewAI](https://github.com/joaomdmoura/crewAI-examples/tree/main/trip_planner). 

## Prerequisites

Before running the script, make sure you have the following:

- [Fireworks.ai](https://fireworks.ai/)
  - I'm using their [Mixtral MoE 8x7B](https://fireworks.ai/models) alternative to OpenAI as it much-much [cheaper](https://fireworks.ai/pricing) with good results.

## How to run
1. Open `flight-recommender/cli.py` and change these details
```js
origin = "Tallinn, Estonia"
destination = "Madrid, Spain"
date_range = "2024-04-01 - 2024-04-05"
interests = "history, food, local experience"
```

2. Run the `cli.py`
```bash
python cli.py
```

3. You can check the logged output in [myoutput.txt](https://github.com/joshuaalpuerto/ML-guide/blob/main/crew-ai/crew_ai/flight-recommender/myoutput.txt)
```bash
[DEBUG]: [Travel Planner] Task output: # Madrid Itinerary: 2024-04-01 - 2024-04-05

## Day 1: Arrival and Exploring the City

Upon arrival in Madrid, check into your hotel and take some time to settle in. Afterward, head out to explore the city's vibrant streets and landmarks.

**Morning:**

- Start your day with a visit to the famous [Puerta del Sol](https://www.kevmrc.com/famous-landmarks-in-madrid#Puerta_del_Sol), one of Madrid's busiest and most well-known public squares.
- From there, walk to the [Plaza Mayor](https://www.kevmrc.com/famous-landmarks-in-madrid#Plaza_Mayor), another iconic square filled with beautiful architecture and lively atmosphere.

**Afternoon:**

- Visit the [Royal Palace of Madrid](https://www.kevmrc.com/famous-landmarks-in-madrid#Royal_Palace_of_Madrid), the largest royal palace in Western Europe, and take in its stunning baroque architecture and opulent interiors.
- Next, head to the [Catedral de la Almudena](https://www.kevmrc.com/famous-landmarks-in-madrid#Catedral_de_la_Almudena), Madrid's most important Catholic church, which combines neoclassical and neogothic styles.

**Evening:**

- Enjoy a traditional Spanish dinner at [Corral de la Moreria](https://www.tripadvisor.com/Restaurant_Review-g187514-d187308-Reviews-Corral_de_la_Moreria-Madrid.html), the oldest Flamenco theater in the world.
- After dinner, take a stroll through [Plaza de Cibeles](https://www.kevmrc.com/famous-landmarks-in-madrid#Plaza_de_Cibeles), a majestic square that pays homage to Spain’s historical legacy and vibrant present.

## Day 2: Art and Culture
```