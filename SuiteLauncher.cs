using System;
using System.IO;
using System.Diagnostics;
using System.Net;
using System.Text;
using System.Threading;
using System.Windows.Forms;

namespace MontanhaCreativeSuite
{
    static class Program
    {
        private const int Port = 8765;
        private static HttpListener _listener;
        private static bool _running = true;
        private static string _baseDir;

        [STAThread]
        static void Main()
        {
            _baseDir = AppDomain.CurrentDomain.BaseDirectory;
            string edgePath = @"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe";
            if (!File.Exists(edgePath))
            {
                edgePath = @"C:\Program Files\Microsoft\Edge\Application\msedge.exe";
            }

            try
            {
                // Inicia o servidor HTTP embutido
                _listener = new HttpListener();
                _listener.Prefixes.Add(string.Format("http://127.0.0.1:{0}/", Port));
                _listener.Start();

                Thread serverThread = new Thread(ServerLoop);
                serverThread.IsBackground = true;
                serverThread.Start();

                // Lança Microsoft Edge em modo de Janela de Aplicativo Nativo
                string appUrl = string.Format("http://127.0.0.1:{0}/index.html", Port);
                string profileDir = Path.Combine(_baseDir, "Data", "Profile");
                if (!Directory.Exists(profileDir)) Directory.CreateDirectory(profileDir);

                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = edgePath;
                psi.Arguments = string.Format("--app=\"{0}\" --window-size=1440,900 --user-data-dir=\"{1}\" --app-id=MontanhaCreativeSuite", appUrl, profileDir);
                psi.UseShellExecute = false;
                
                Process edgeProc = Process.Start(psi);
                edgeProc.WaitForExit();
            }
            catch (Exception ex)
            {
                MessageBox.Show("Erro ao executar Montanha Creative Suite: " + ex.Message, "Montanha Suite", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            finally
            {
                _running = false;
                if (_listener != null && _listener.IsListening)
                {
                    _listener.Stop();
                }
            }
        }

        private static void ServerLoop()
        {
            while (_running)
            {
                try
                {
                    HttpListenerContext ctx = _listener.GetContext();
                    ThreadPool.QueueUserWorkItem((state) => HandleRequest((HttpListenerContext)state), ctx);
                }
                catch
                {
                    if (!_running) break;
                }
            }
        }

        private static void HandleRequest(HttpListenerContext ctx)
        {
            try
            {
                string rawUrl = ctx.Request.Url.AbsolutePath.TrimStart('/');
                if (string.IsNullOrEmpty(rawUrl)) rawUrl = "index.html";

                string filePath = Path.Combine(_baseDir, rawUrl.Replace('/', Path.DirectorySeparatorChar));

                if (File.Exists(filePath))
                {
                    byte[] bytes = File.ReadAllBytes(filePath);
                    string ext = Path.GetExtension(filePath).ToLower();
                    string mime = "application/octet-stream";
                    if (ext == ".html" || ext == ".htm") mime = "text/html; charset=utf-8";
                    else if (ext == ".css") mime = "text/css; charset=utf-8";
                    else if (ext == ".js") mime = "application/javascript; charset=utf-8";
                    else if (ext == ".png") mime = "image/png";
                    else if (ext == ".jpg" || ext == ".jpeg") mime = "image/jpeg";
                    else if (ext == ".svg") mime = "image/svg+xml";

                    ctx.Response.ContentType = mime;
                    ctx.Response.ContentLength64 = bytes.Length;
                    ctx.Response.OutputStream.Write(bytes, 0, bytes.Length);
                }
                else
                {
                    ctx.Response.StatusCode = 404;
                }
                ctx.Response.Close();
            }
            catch {}
        }
    }
}
