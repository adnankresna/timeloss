"use client";

import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { Participant } from '../types/types';

// Register all Chart.js components
Chart.register(...registerables);

interface MeetingCostChartProps {
  participants: Participant[];
  totalCost: number | null;
  isDarkMode: boolean;
  calculateIndividualCost: (participant: Participant) => number;
}

export default function MeetingCostChart({
  participants,
  totalCost,
  calculateIndividualCost,
  isDarkMode
}: MeetingCostChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current || participants.length === 0 || totalCost === null) return;

    // Destroy previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Prepare data for chart - ensure the costs are accurate
    const labels = participants.map((p, index) => p.name || `Person ${index + 1}`);
    const costs = participants.map(p => calculateIndividualCost(p));
    
    // Calculate sum to ensure percentages add up to 100%
    const totalIndividualCosts = costs.reduce((sum, cost) => sum + cost, 0);
    
    // Calculate accurate percentages for the pie chart
    const percentages = costs.map(cost => (cost / totalIndividualCosts) * 100);
    
    // Round to 1 decimal place for display
    const roundedPercentages = percentages.map(p => parseFloat(p.toFixed(1)));
    
    // Format labels with percentage and cost
    const labelsWithPercentage = labels.map((label, i) => 
      `${label} (${roundedPercentages[i]}%)`
    );
    
    // Enhanced colors for better visual appeal and contrast in both modes
    const backgroundColors = [
      isDarkMode ? 'rgba(94, 92, 230, 0.85)' : 'rgba(72, 68, 197, 0.85)',  // indigo
      isDarkMode ? 'rgba(52, 199, 89, 0.85)' : 'rgba(45, 156, 78, 0.85)',  // green
      isDarkMode ? 'rgba(255, 45, 85, 0.85)' : 'rgba(224, 30, 90, 0.85)',  // pink
      isDarkMode ? 'rgba(0, 113, 227, 0.85)' : 'rgba(0, 102, 204, 0.85)',  // blue
      isDarkMode ? 'rgba(255, 149, 0, 0.85)' : 'rgba(224, 133, 0, 0.85)',  // orange
      isDarkMode ? 'rgba(88, 86, 214, 0.75)' : 'rgba(72, 68, 197, 0.75)',  // purple
      isDarkMode ? 'rgba(52, 170, 220, 0.75)' : 'rgba(0, 122, 204, 0.75)', // cyan
      isDarkMode ? 'rgba(255, 204, 0, 0.75)' : 'rgba(224, 173, 0, 0.75)',  // yellow
      isDarkMode ? 'rgba(175, 82, 222, 0.75)' : 'rgba(154, 68, 201, 0.75)', // purple
      isDarkMode ? 'rgba(90, 200, 250, 0.75)' : 'rgba(0, 152, 219, 0.75)', // teal
    ];

    // Set theme-specific options
    const textColor = isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    // Border colors for segments
    const borderColor = isDarkMode ? 'rgba(30, 30, 46, 1)' : 'rgba(255, 255, 255, 1)';
    const hoverBorderColor = isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)';

    // Create new chart
    chartInstance.current = new Chart(ctx, {
      type: participants.length > 5 ? 'bar' : 'doughnut',
      data: {
        labels: labelsWithPercentage,
        datasets: [{
          label: 'Cost per Participant ($)',
          data: costs,
          backgroundColor: backgroundColors.slice(0, participants.length),
          borderColor: borderColor,
          borderWidth: 1.5,
          hoverOffset: 10,
          hoverBorderWidth: 2,
          hoverBorderColor: hoverBorderColor
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        layout: {
          padding: {
            top: 10,
            bottom: 10
          }
        },
        plugins: {
          legend: {
            position: participants.length > 3 ? 'bottom' : 'right',
            labels: {
              color: textColor,
              font: {
                size: 12,
                weight: 500
              },
              padding: 15,
              usePointStyle: true,
              pointStyle: 'circle'
            },
            title: {
              display: false
            }
          },
          tooltip: {
            backgroundColor: isDarkMode ? 'rgba(30, 30, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            titleColor: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
            bodyColor: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
            borderColor: gridColor,
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            displayColors: true,
            boxPadding: 6,
            titleFont: {
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              size: 13
            },
            callbacks: {
              label: function(context) {
                const label = context.label?.split(' (')[0] || '';
                const value = context.raw as number;
                const percentage = ((value / totalIndividualCosts) * 100).toFixed(1);
                return [
                  `${label}: $${value.toFixed(2)}`,
                  `${percentage}% of total cost`
                ];
              }
            }
          }
        },
        scales: participants.length > 5 ? {
          y: {
            beginAtZero: true,
            grid: {
              color: gridColor
            },
            ticks: {
              color: textColor,
              font: {
                size: 12
              }
            },
            title: {
              display: true,
              text: 'Cost ($)',
              color: textColor,
              font: {
                size: 13,
                weight: 600
              }
            }
          },
          x: {
            grid: {
              color: gridColor
            },
            ticks: {
              color: textColor,
              font: {
                size: 12
              }
            },
            title: {
              display: true,
              text: 'Attendees',
              color: textColor,
              font: {
                size: 13,
                weight: 600
              }
            }
          }
        } : undefined,
        animation: {
          duration: 1000,
          easing: 'easeOutQuart'
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [participants, totalCost, isDarkMode, calculateIndividualCost]);

  return (
    <div className="w-full h-full">
      <canvas ref={chartRef} width="400" height="200"></canvas>
    </div>
  );
} 