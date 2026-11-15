using System;
using System.IO;
using System.Diagnostics;
using System.Net;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Win32;

namespace MontanhaCreativeSuite
{
    static class Program
    {
        private const int Port = 8765;

        [STAThread]
        static void Main()
        {
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            string edgePath = FindEdgePath();

            if (string.IsNullOrEmpty(edgePath) || !File.Exists(edgePath))
            {
                MessageBox.Show("Microsoft Edge não foi encontrado no sistema.\nPor favor instale o Microsoft Edge para executar a Suite.",
                    "Montanha Creative Suite", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                return;
            }

            try
            {
                // 1. Garante que o servidor Python está rodando na porta 8765
                if (!IsServerRunning())
                {
                    string serverScript = Path.Combine(baseDir, "server.py");
                    if (File.Exists(serverScript))
                    {
                        ProcessStartInfo pyPsi = new ProcessStartInfo();
                        pyPsi.FileName = FindPythonPath();
                        pyPsi.Arguments = string.Format("\"{0}\" {1}", serverScript, Port);
                        pyPsi.WorkingDirectory = baseDir;
                        pyPsi.CreateNoWindow = true;
                        pyPsi.UseShellExecute = false;
                        Process.Start(pyPsi);
                    }

                    // Aguarda o servidor responder na porta 8765 (máx 6 segundos)
                    for (int i = 0; i < 30; i++)
                    {
                        Thread.Sleep(200);
                        if (IsServerRunning()) break;
                    }
                }

                // 2. Lança Microsoft Edge em modo de Janela de Aplicativo Nativo
                string appUrl = string.Format("http://127.0.0.1:{0}/index.html", Port);
                string profileDir = Path.Combine(baseDir, "Data", "Profile");
                if (!Directory.Exists(profileDir)) Directory.CreateDirectory(profileDir);

                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = edgePath;
                psi.Arguments = string.Format("--app=\"{0}\" --window-size=1440,900 --user-data-dir=\"{1}\" --app-id=MontanhaCreativeSuite", appUrl, profileDir);
                psi.UseShellExecute = true;
                Process.Start(psi);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Erro ao executar Montanha Creative Suite: " + ex.Message, "Montanha Suite", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private static bool IsServerRunning()
        {
            try
            {
                HttpWebRequest req = (HttpWebRequest)WebRequest.Create(string.Format("http://127.0.0.1:{0}/api/config", Port));
                req.Timeout = 600;
                req.Method = "GET";
                using (HttpWebResponse resp = (HttpWebResponse)req.GetResponse())
                {
                    return resp.StatusCode == HttpStatusCode.OK;
                }
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
                string pw = Path.Combine(localApp, string.Format(@"Programs\Python\{0}\pythonw.exe", v));
                if (File.Exists(pw)) return pw;
                string p = Path.Combine(localApp, string.Format(@"Programs\Python\{0}\python.exe", v));
                if (File.Exists(p)) return p;
            }

            string pathEnv = Environment.GetEnvironmentVariable("PATH");
            if (!string.IsNullOrEmpty(pathEnv))
            {
                foreach (string dir in pathEnv.Split(';'))
                {
                    string trimmed = dir.Trim();
                    if (!string.IsNullOrEmpty(trimmed))
                    {
                        string candidateW = Path.Combine(trimmed, "pythonw.exe");
                        if (File.Exists(candidateW)) return candidateW;
                        string candidate = Path.Combine(trimmed, "python.exe");
                        if (File.Exists(candidate)) return candidate;
                    }
                }
            }
            return "pythonw";
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
    }
}
