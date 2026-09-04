import { BarChart, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

const trainingData = [
  { epoch: 0, f1Score: 45.2 },
  { epoch: 5, f1Score: 58.4 },
  { epoch: 10, f1Score: 68.4 },
  { epoch: 15, f1Score: 74.2 },
  { epoch: 20, f1Score: 79.1 },
  { epoch: 25, f1Score: 81.3 },
  { epoch: 30, f1Score: 82.5 },
  { epoch: 35, f1Score: 83.9 },
  { epoch: 40, f1Score: 84.7 },
  { epoch: 45, f1Score: 85.2 },
  { epoch: 50, f1Score: 85.8 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-grid-panel border border-grid-border p-3 rounded shadow-xl">
        <p className="text-grid-text-muted text-xs font-mono mb-1">EPOCH {label}</p>
        <p className="text-grid-accent font-bold text-sm">
          F1 Score: {payload[0].value}%
        </p>
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  return (
    <div className="h-full w-full p-8 bg-grid-bg text-grid-text-muted overflow-y-auto">
      <h1 className="text-2xl font-bold text-grid-text mb-6 flex items-center gap-2">
        <BarChart className="text-grid-accent" /> AI Prediction Analytics
      </h1>

      <div className="panel p-6 border border-grid-border bg-grid-panel rounded-xl shadow-lg">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-lg font-bold text-grid-text mb-1">GAT Model Training Convergence</h2>
            <p className="text-sm text-grid-text-muted">
              Tracking the F1 Accuracy Score of the Graph Attention Network across 50 training epochs.
            </p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-3xl font-black text-grid-text">85.8<span className="text-lg text-grid-text-dim">%</span></span>
            <span className="text-[10px] text-grid-nominal font-bold tracking-widest uppercase">Final Score</span>
          </div>
        </div>

        {/* Recharts Container */}
        <div className="w-full h-80 bg-grid-bg-alt rounded-lg border border-grid-border p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trainingData} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d303a" vertical={false} />
              <XAxis
                dataKey="epoch"
                stroke="#6b7280"
                tick={{ fill: '#6b7280', fontSize: 12, fontFamily: 'monospace' }}
                tickMargin={10}
                axisLine={{ stroke: '#2d303a' }}
                tickLine={false}
              />
              <YAxis
                domain={[40, 100]}
                stroke="#6b7280"
                tick={{ fill: '#6b7280', fontSize: 12, fontFamily: 'monospace' }}
                tickFormatter={(val) => `${val}%`}
                axisLine={false}
                tickLine={false}
                tickMargin={10}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#2d303a', strokeWidth: 1, strokeDasharray: '4 4' }} />

              {/* Benchmark Reference Line */}
              <ReferenceLine y={85.8} stroke="#22c55e" strokeDasharray="3 3" label={{ position: 'top', value: 'Target Benchmark (85.8%)', fill: '#22c55e', fontSize: 10, fontFamily: 'monospace' }} />

              <Line
                type="monotone"
                dataKey="f1Score"
                stroke="#00e5ff"
                strokeWidth={2}
                dot={{ r: 4, fill: '#1b1d27', stroke: '#00e5ff', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#00e5ff', stroke: '#ffffff', strokeWidth: 2 }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-grid-bg-alt border border-grid-border p-4 rounded-lg flex items-center gap-3">
             <Activity className="text-grid-accent w-5 h-5" />
             <div className="flex flex-col">
               <span className="text-[10px] text-grid-text-dim uppercase tracking-widest font-mono">Dataset Size</span>
               <span className="text-grid-text font-bold">10,000 Cascades</span>
             </div>
          </div>
          <div className="bg-grid-bg-alt border border-grid-border p-4 rounded-lg flex items-center gap-3">
             <Activity className="text-grid-warning w-5 h-5" />
             <div className="flex flex-col">
               <span className="text-[10px] text-grid-text-dim uppercase tracking-widest font-mono">Convergence</span>
               <span className="text-grid-text font-bold">Epoch 42</span>
             </div>
          </div>
          <div className="bg-grid-bg-alt border border-grid-border p-4 rounded-lg flex items-center gap-3">
             <Activity className="text-grid-danger w-5 h-5" />
             <div className="flex flex-col">
               <span className="text-[10px] text-grid-text-dim uppercase tracking-widest font-mono">Loss Function</span>
               <span className="text-grid-text font-bold">BCEWithLogitsLoss</span>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
}