"use client";

import { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { Participant, CurrencyInfo } from '../types/types';

// Register all Chart.js components
Chart.register(...registerables);

interface MeetingCostChartProps {
  participants: Participant[];
  totalCost: number | null;
  isDarkMode: boolean;
  calculateIndividualCost: (participant: Participant) => number;
  currency: CurrencyInfo;
}

export default function MeetingCostChart({
  participants,
  totalCost,
  calculateIndividualCost,
  isDarkMode,
  currency
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
    
    // Calculate the total cost from individual costs to ensure accuracy
    const totalIndividualCosts = costs.reduce((sum, cost) => sum + cost, 0);
    
    // Format cost for display
    const formatCost = (cost: number) => {
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: cost < 100 ? 2 : 0,
        maximumFractionDigits: cost < 100 ? 2 : 0
      }).format(cost);
    };
    
    // Create the chart with our data
    chartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: costs,
          backgroundColor: [
            isDarkMode ? 'rgba(94, 92, 230, 0.9)' : 'rgba(88, 86, 214, 0.9)',    // Indigo
            isDarkMode ? 'rgba(52, 199, 89, 0.9)' : 'rgba(52, 199, 89, 0.9)',    // Green
            isDarkMode ? 'rgba(255, 55, 95, 0.9)' : 'rgba(224, 30, 90, 0.9)',    // Pink
            isDarkMode ? 'rgba(10, 132, 255, 0.9)' : 'rgba(0, 102, 204, 0.9)',   // Blue
            isDarkMode ? 'rgba(255, 159, 10, 0.9)' : 'rgba(224, 133, 0, 0.9)',   // Orange
            // Lighter versions for additional participants
            isDarkMode ? 'rgba(94, 92, 230, 0.7)' : 'rgba(88, 86, 214, 0.7)',
            isDarkMode ? 'rgba(52, 199, 89, 0.7)' : 'rgba(52, 199, 89, 0.7)',
            isDarkMode ? 'rgba(255, 55, 95, 0.7)' : 'rgba(224, 30, 90, 0.7)',
            isDarkMode ? 'rgba(10, 132, 255, 0.7)' : 'rgba(0, 102, 204, 0.7)',
            isDarkMode ? 'rgba(255, 159, 10, 0.7)' : 'rgba(224, 133, 0, 0.7)',
            // Even lighter versions if needed
            isDarkMode ? 'rgba(94, 92, 230, 0.5)' : 'rgba(88, 86, 214, 0.5)',
            isDarkMode ? 'rgba(52, 199, 89, 0.5)' : 'rgba(52, 199, 89, 0.5)',
            isDarkMode ? 'rgba(255, 55, 95, 0.5)' : 'rgba(224, 30, 90, 0.5)',
            isDarkMode ? 'rgba(10, 132, 255, 0.5)' : 'rgba(0, 102, 204, 0.5)',
            isDarkMode ? 'rgba(255, 159, 10, 0.5)' : 'rgba(224, 133, 0, 0.5)',
          ],
          borderColor: isDarkMode ? 'rgba(30, 30, 30, 0.7)' : 'rgba(255, 255, 255, 0.7)',
          borderWidth: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              boxWidth: 12,
              padding: 15,
              color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
              font: {
                size: 12,
                family: '-apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
              },
              // Custom formatter to show costs in legend
              generateLabels: function(chart) {
                const data = chart.data;
                if (data.labels?.length && data.datasets.length) {
                  return data.labels.map((label, i) => {
                    const dataset = data.datasets[0];
                    const value = dataset.data?.[i] as number;
                    
                    // Fix the type error by safely handling backgroundColor
                    const backgroundColor = Array.isArray(dataset.backgroundColor) 
                      ? dataset.backgroundColor[i] as string 
                      : typeof dataset.backgroundColor === 'string' 
                        ? dataset.backgroundColor 
                        : 'rgba(0, 0, 0, 0.1)';
                    
                    // Format with currency and percentage
                    const percentage = ((value / totalIndividualCosts) * 100).toFixed(0);
                    const text = `${label} (${currency.symbol}${formatCost(value)}, ${percentage}%)`;
                    
                    return {
                      text: text,
                      fillStyle: backgroundColor,
                      hidden: false,
                      index: i
                    };
                  });
                }
                return [];
              }
            },
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const label = context.label?.split(' (')[0] || '';
                const value = context.raw as number;
                const percentage = ((value / totalIndividualCosts) * 100).toFixed(1);
                return [
                  `${label}: ${currency.symbol}${formatCost(value)}`,
                  `${percentage}% of total cost`
                ];
              }
            }
          },
        },
        // Hover animations
        hover: {
          mode: 'nearest',
        },
        animation: {
          animateScale: true,
          animateRotate: true
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [participants, totalCost, isDarkMode, calculateIndividualCost, currency]);

  return (
    <div className="w-full h-full">
      <canvas ref={chartRef} width="400" height="200"></canvas>
    </div>
  );
} 