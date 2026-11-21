using System;
using System.IO;
using System.Diagnostics;
using System.Net;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Win32;

namespace MontanhaCreative
{
    static class Program
    {
        private const int Port = 8780;

        [STAThread]
        static void Main()
        {
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            string edgePath = FindEdgePath();

            if (string.IsNullOrEmpty(edgePath) || !File.Exists(edgePath))
            {
                MessageBox.Show("Microsoft Edge não foi encontrado no sistema.\nPor favor instale o Microsoft Edge para executar o Montanha Creative.",
                    "Montanha Creative", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            try
            {
                string logFile = Path.Combine(baseDir, "Data", "launcher.log");
                string dataDir = Path.Combine(baseDir, "Data");
                if (!Directory.Exists(dataDir)) Directory.CreateDirectory(dataDir);

                Action<string> log = (msg) => {
                    try { File.AppendAllText(logFile, string.Format("[{0:HH:mm:ss.fff}] {1}\r\n", DateTime.Now, msg)); } catch {}
                };

                log("Iniciando Montanha Creative...");

                // 1. Garante que o servidor Python está rodando na porta 8780
                if (!IsServerRunning())
                {
                    log("Servidor não está respondendo. Liberando porta se necessário...");
                    EnsurePortFree(Port);
                    Thread.Sleep(300);

                    string serverScript = Path.Combine(baseDir, "server.py");
                    if (File.Exists(serverScript))
                    {
                        string pyPath = FindPythonPath();
                        log("Iniciando server.py com: " + pyPath);

                        ProcessStartInfo pyPsi = new ProcessStartInfo();
                        pyPsi.FileName = pyPath;
                        pyPsi.Arguments = string.Format("\"{0}\" {1}", serverScript, Port);
                        pyPsi.WorkingDirectory = baseDir;
                        pyPsi.CreateNoWindow = true;
                        pyPsi.UseShellExecute = false;
                        Process.Start(pyPsi);
                    }

                    // Aguarda o servidor responder na porta 8780 (máx 10 segundos)
                    bool serverReady = false;
                    for (int i = 0; i < 50; i++)
                    {
                        Thread.Sleep(200);
                        if (IsServerRunning())
                        {
                            serverReady = true;
                            log(string.Format("Servidor pronto após {0}ms", (i + 1) * 200));
                            break;
                        }
                    }

                    if (!serverReady)
                    {
                        log("ERRO: Servidor local não respondeu a tempo.");
                        MessageBox.Show("O servidor local do Montanha Creative não respondeu a tempo na porta 8780.\nVerifique se o Python está instalado ou consulte Data\\server.log.",
                            "Montanha Creative", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                        return;
                    }
                }
                else
                {
                    log("Servidor já estava ativo na porta 8780.");
                }

                // 2. Lança Microsoft Edge em modo de Janela de Aplicativo Nativo
                string appUrl = string.Format("http://127.0.0.1:{0}/index.html", Port);
                string profileDir = Path.Combine(baseDir, "Data", "Profile");
                if (!Directory.Exists(profileDir)) Directory.CreateDirectory(profileDir);

                log("Abrindo Edge: " + appUrl);
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = edgePath;
                psi.Arguments = string.Format("--app=\"{0}\" --window-size=1440,900 --user-data-dir=\"{1}\" --app-id=MontanhaCreative", appUrl, profileDir);
                psi.UseShellExecute = true;
                Process.Start(psi);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Erro ao executar Montanha Creative: " + ex.Message, "Montanha Creative", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private static bool IsServerRunning()
        {
            try
            {
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create(string.Format("http://127.0.0.1:{0}/api/config", Port));
                req.Timeout = 1000;
                req.Method = "GET";
                using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse())
                {
                    if (resp.StatusCode == HttpStatusCode.OK)
                    {
                        using (StreamReader sr = new StreamReader(resp.GetResponseStream()))
                        {
                            string text = sr.ReadToEnd();
                            return text.Contains("Montanha Creative");
                        }
                    }
                }
                return false;
            }
            catch
            {
                return false;
            }
        }

        private static string FindPythonPath()
        {
            string localApp = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
            string[] versions = new string[] { "Python311", "Python312", "Python310", "Python39", "Python38" };
            foreach (string v in versions)
            {
                string p = Path.Combine(localApp, string.Format(@"Programs\Python\{0}\python.exe", v));
                if (File.Exists(p)) return p;
                string pw = Path.Combine(localApp, string.Format(@"Programs\Python\{0}\pythonw.exe", v));
                if (File.Exists(pw)) return pw;
            }

            string pathEnv = Environment.GetEnvironmentVariable("PATH");
            if (!string.IsNullOrEmpty(pathEnv))
            {
                foreach (string dir in pathEnv.Split(';'))
                {
                    string trimmed = dir.Trim();
                    if (!string.IsNullOrEmpty(trimmed))
                    {
                        string candidate = Path.Combine(trimmed, "python.exe");
                        if (File.Exists(candidate)) return candidate;
                        string candidateW = Path.Combine(trimmed, "pythonw.exe");
                        if (File.Exists(candidateW)) return candidateW;
                    }
                }
            }
            return "python";
        }

        private static string FindEdgePath()
        {
            string p1 = @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe";
            if (File.Exists(p1)) return p1;
            string p2 = @"C:\Program Files\Microsoft\Edge\Application\msedge.exe";
            if (File.Exists(p2)) return p2;

            try
            {
                using (RegistryKey key = Registry.LocalMachine.OpenSubKey(@"SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe"))
                {
                    if (key != null)
                    {
                        object val = key.GetValue("");
                        if (val != null && File.Exists(val.ToString()))
                            return val.ToString();
                    }
                }
            }
            catch { }

            return null;
        }

        private static void EnsurePortFree(int port)
        {
            try
            {
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = "cmd.exe";
                psi.Arguments = string.Format("/c for /f \"tokens=5\" %a in ('netstat -aon ^| findstr \":{0}\" ^| findstr \"LISTENING\"') do taskkill /F /PID %a", port);
                psi.CreateNoWindow = true;
                psi.UseShellExecute = false;
                using (Process p = Process.Start(psi))
                {
                    p.WaitForExit(3000);
                }
            }
            catch {}
        }
    }
}
