import { SupportedLanguage } from '../../types';

export interface SampleCodePreset {
  id: string;
  name: string;
  language: SupportedLanguage;
  fileName: string;
  description: string;
  code: string;
}

export const sampleCodePresets: SampleCodePreset[] = [
  {
    id: 'python-ecommerce',
    name: 'Python: Eコマース注文処理 & 非同期通信',
    language: 'python',
    fileName: 'order_service.py',
    description: '非同期API通信、dataclass、I/Oファイル保存、呼び出し関係、再帰処理を含むPythonの実践コード',
    code: `import os
import json
import asyncio
from dataclasses import dataclass
from typing import List, Optional
import httpx

@dataclass
class OrderItem:
    item_id: str
    quantity: int
    unit_price: float

class OrderProcessor:
    """注文受付と決済・在庫検証を行うメインサービス"""
    
    def __init__(self, api_url: str):
        self.api_url = api_url
        self.logs_dir = "./logs"
        os.makedirs(self.logs_dir, exist_ok=True)

    async def execute_order_pipeline(self, order_id: str, items: List[OrderItem]) -> bool:
        # 1. 在庫の検証
        if not await self.verify_inventory(items):
            print(f"注文 {order_id}: 在庫不足")
            return False

        # 2. 合計金額の計算
        total = self.calculate_total(items)

        # 3. 決済APIの実行
        payment_success = await self.process_payment(order_id, total)
        if not payment_success:
            return False

        # 4. ログ保存と配送手続き
        self.save_order_receipt(order_id, total, items)
        self.dispatch_shipping(order_id)
        return True

    async def verify_inventory(self, items: List[OrderItem]) -> bool:
        async with httpx.AsyncClient() as client:
            resp = await client.post(f"{self.api_url}/inventory/check", json={"count": len(items)})
            return resp.status_code == 200

    def calculate_total(self, items: List[OrderItem]) -> float:
        subtotal = sum(item.quantity * item.unit_price for item in items)
        tax = subtotal * 0.1
        return subtotal + tax

    async def process_payment(self, order_id: str, amount: float) -> bool:
        async with httpx.AsyncClient() as client:
            resp = await client.post(f"{self.api_url}/payments", json={"order_id": order_id, "amount": amount})
            return resp.status_code == 200

    def save_order_receipt(self, order_id: str, total: float, items: List[OrderItem]):
        receipt_path = os.path.join(self.logs_dir, f"{order_id}.json")
        data = {
            "order_id": order_id,
            "total": total,
            "item_count": len(items)
        }
        with open(receipt_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def dispatch_shipping(self, order_id: str):
        print(f"出荷指示を送信しました: {order_id}")

def calculate_discount_recursive(price: float, step: int) -> float:
    """割引ステップを再帰的に適用"""
    if step <= 0:
        return price
    return calculate_discount_recursive(price * 0.95, step - 1)
`
  },
  {
    id: 'ts-analytics',
    name: 'TypeScript: データ分析 & パイプライン',
    language: 'typescript',
    fileName: 'analyticsEngine.ts',
    description: '型定義、インターフェース、非同期Fetch、メトリクス集計、エラーハンドリングを備えたTSコード',
    code: `export interface MetricPayload {
  timestamp: number;
  cpuUsage: number;
  memoryUsage: number;
  activeConnections: number;
}

export interface HealthReport {
  status: 'healthy' | 'warning' | 'critical';
  averageCpu: number;
  peakMemory: number;
  recommendations: string[];
}

export class AnalyticsEngine {
  private endpoint: string;

  constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  public async runDiagnosticPipeline(serverId: string): Promise<HealthReport> {
    const rawData = await this.fetchServerMetrics(serverId);
    const validated = this.validatePayloads(rawData);
    const stats = this.computeAggregates(validated);
    const report = this.generateHealthReport(stats);

    await this.persistReport(serverId, report);
    return report;
  }

  private async fetchServerMetrics(serverId: string): Promise<MetricPayload[]> {
    const response = await fetch(\`\${this.endpoint}/servers/\${serverId}/metrics\`);
    if (!response.ok) {
      throw new Error(\`Failed to fetch metrics: \${response.statusText}\`);
    }
    return response.json();
  }

  private validatePayloads(data: MetricPayload[]): MetricPayload[] {
    return data.filter(d => d.cpuUsage >= 0 && d.memoryUsage >= 0);
  }

  private computeAggregates(data: MetricPayload[]) {
    const totalCpu = data.reduce((acc, curr) => acc + curr.cpuUsage, 0);
    const avgCpu = totalCpu / Math.max(1, data.length);
    const peakMem = Math.max(...data.map(d => d.memoryUsage), 0);

    return { avgCpu, peakMem, count: data.length };
  }

  private generateHealthReport(stats: { avgCpu: number; peakMem: number; count: number }): HealthReport {
    const recommendations: string[] = [];
    let status: HealthReport['status'] = 'healthy';

    if (stats.avgCpu > 85) {
      status = 'critical';
      recommendations.push('CPU負荷が限界値を超えています。オートスケールを実行してください。');
    } else if (stats.avgCpu > 65) {
      status = 'warning';
      recommendations.push('CPU使用率が高負荷傾向にあります。');
    }

    if (stats.peakMem > 90) {
      recommendations.push('メモリリークの可能性があります。プロファイラを確認してください。');
    }

    return {
      status,
      averageCpu: Math.round(stats.avgCpu * 10) / 10,
      peakMemory: stats.peakMem,
      recommendations
    };
  }

  private async persistReport(serverId: string, report: HealthReport): Promise<void> {
    localStorage.setItem(\`report_\${serverId}\`, JSON.stringify(report));
  }
}
`
  },
  {
    id: 'rust-crypto',
    name: 'Rust: ハッシュ計算 & バッファ管理',
    language: 'rust',
    fileName: 'hasher.rs',
    description: '構造体、implブロック、Resultエラー処理、再帰計算、I/Oを含むRustコード',
    code: `use std::fs::File;
use std::io::{self, Read, Write};

pub struct BlockHasher {
    algorithm: String,
    rounds: u32,
}

impl BlockHasher {
    pub fn new(algorithm: &str, rounds: u32) -> Self {
        Self {
            algorithm: algorithm.to_string(),
            rounds,
        }
    }

    pub fn process_file_checksum(&self, path: &str) -> Result<String, io::Error> {
        let raw_bytes = self.read_bytes_from_disk(path)?;
        let checksum = self.compute_multi_round_hash(&raw_bytes, self.rounds);
        self.log_checksum(path, &checksum)?;
        Ok(checksum)
    }

    fn read_bytes_from_disk(&self, path: &str) -> Result<Vec<u8>, io::Error> {
        let mut file = File::open(path)?;
        let mut buffer = Vec::new();
        file.read_to_end(&mut buffer)?;
        Ok(buffer)
    }

    fn compute_multi_round_hash(&self, data: &[u8], rounds: u32) -> String {
        if rounds == 0 {
            return format!("{:x?}", &data[..std::cmp::min(8, data.len())]);
        }
        // 擬似ハッシュ変換ステップ
        let mut transformed = data.to_vec();
        for byte in transformed.iter_mut() {
            *byte = byte.wrapping_add(rounds as u8);
        }
        self.compute_multi_round_hash(&transformed, rounds - 1)
    }

    fn log_checksum(&self, path: &str, checksum: &str) -> Result<(), io::Error> {
        println!("Checked [{}] -> {}", path, checksum);
        Ok(())
    }
}
`
  },
  {
    id: 'go-worker',
    name: 'Go: 並行ワーカープール & HTTPディスパッチ',
    language: 'go',
    fileName: 'worker_pool.go',
    description: 'goroutine、channel、struct、メソッドレシーバー、deferによるGo並行処理コード',
    code: `package main

import (
	"fmt"
	"net/http"
	"sync"
	"time"
)

type Job struct {
	ID  int
	URL string
}

type Result struct {
	JobID      int
	StatusCode int
	Latency    time.Duration
	Err        error
}

type WorkerPool struct {
	WorkerCount int
	JobQueue    chan Job
	Results     chan Result
	wg          sync.WaitGroup
}

func NewWorkerPool(workers int, queueSize int) *WorkerPool {
	return &WorkerPool{
		WorkerCount: workers,
		JobQueue:    make(chan Job, queueSize),
		Results:     make(chan Result, queueSize),
	}
}

func (wp *WorkerPool) Start() {
	for i := 1; i <= wp.WorkerCount; i++ {
		wp.wg.Add(1)
		go wp.worker(i)
	}
}

func (wp *WorkerPool) worker(id int) {
	defer wp.wg.Done()
	for job := range wp.JobQueue {
		res := wp.executeJob(job)
		wp.Results <- res
	}
}

func (wp *WorkerPool) executeJob(job Job) Result {
	start := time.Now()
	resp, err := http.Get(job.URL)
	if err != nil {
		return Result{JobID: job.ID, Err: err}
	}
	defer resp.Body.Close()

	return Result{
		JobID:      job.ID,
		StatusCode: resp.StatusCode,
		Latency:    time.Since(start),
	}
}

func (wp *WorkerPool) Submit(job Job) {
	wp.JobQueue <- job
}

func (wp *WorkerPool) Shutdown() {
	close(wp.JobQueue)
	wp.wg.Wait()
	close(wp.Results)
}
`
  }
];
