# Timeloss

## Overview

Timeloss is a straightforward tool designed to help users calculate the total cost of a meeting. Users input the number of participants, their average hourly rate, and the meeting duration, and the website provides an instant cost estimate.

## Features

- **Simple Input Fields**:
  - Number of Participants
  - Average Hourly Rate (USD)
  - Meeting Duration (hours or minutes)

- **Real-Time Calculation**: Instantly updates the total cost as users input data

- **Responsive Design**: Works on desktop and mobile devices

- **Accessibility**: Built with accessible UI components

## Technology Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn UI](https://ui.shadcn.com/)

## Getting Started

1. **Clone the repository**

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)** with your browser to see the calculator

## How It Works

The Meeting Calculator uses a simple formula to calculate the total cost of a meeting:

- If duration is in hours:
  `Total Cost = Number of Participants * Average Hourly Rate * Duration`

- If duration is in minutes:
  `Total Cost = Number of Participants * Average Hourly Rate * (Duration / 60)`

All calculations are performed client-side using React state management, with no backend required.

