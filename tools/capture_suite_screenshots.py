import os
import asyncio
from playwright.async_api import async_playwright

async def main():
    base_dir = r"C:\Users\Administrator\Documents\Projetos\Ecossistema Montanha\Montanha Creative"
    html_path = os.path.join(base_dir, "index.html")
    output_dir = os.path.join(base_dir, "screenshots")
    os.makedirs(output_dir, exist_ok=True)
    
    file_url = f"file:///{html_path.replace(os.sep, '/')}"
    print(f"Opening: {file_url}")
    
    async with async_playwright() as p:
        # Launch Microsoft Edge
        browser = await p.chromium.launch(
            channel="msedge",
            headless=True,
            args=["--disable-web-security", "--force-device-scale-factor=1.25"]
        )
        context = await browser.new_context(viewport={"width": 1600, "height": 950})
        page = await context.new_page()
        
        await page.goto(file_url)
        await page.wait_for_timeout(1000)
        
        # 1. Capture Hub Dashboard
        print("Capturing 01_hub_dashboard.png...")
        await page.screenshot(path=os.path.join(output_dir, "01_hub_dashboard.png"))
        
        # 2. Capture Video Studio
        print("Capturing 02_aba_video_studio.png...")
        await page.click('button[data-view="video"]')
        await page.wait_for_timeout(600)
        await page.screenshot(path=os.path.join(output_dir, "02_aba_video_studio.png"))
        
        # 3. Capture Photo Lab
        print("Capturing 03_aba_photo_lab.png...")
        await page.click('button[data-view="photo"]')
        await page.wait_for_timeout(600)
        await page.screenshot(path=os.path.join(output_dir, "03_aba_photo_lab.png"))
        
        # 4. Capture Canvix Design
        print("Capturing 04_aba_canvix_design.png...")
        await page.click('button[data-view="canvix"]')
        await page.wait_for_timeout(600)
        await page.screenshot(path=os.path.join(output_dir, "04_aba_canvix_design.png"))
        
        # 5. Capture AI Text-to-Photo
        print("Capturing 05_aba_ai_text2photo.png...")
        await page.click('button[data-view="ai"]')
        await page.wait_for_timeout(600)
        await page.screenshot(path=os.path.join(output_dir, "05_aba_ai_text2photo.png"))
        
        # 6. Capture Media Library & Drive
        print("Capturing 06_aba_midiateca_drive.png...")
        await page.click('button[data-view="media"]')
        await page.wait_for_timeout(600)
        await page.screenshot(path=os.path.join(output_dir, "06_aba_midiateca_drive.png"))
        
        # 7. Capture Export Modal
        print("Capturing 07_modal_exportacao.png...")
        await page.click("#btn-open-export")
        await page.wait_for_timeout(600)
        await page.screenshot(path=os.path.join(output_dir, "07_modal_exportacao.png"))
        
        # 8. Close Modal and capture Header / Navigation Close-up
        print("Capturing 08_detalhe_botoes_header.png...")
        await page.click(".modal-close")
        await page.wait_for_timeout(400)
        await page.click('button[data-view="hub"]')
        await page.wait_for_timeout(400)
        header_elem = await page.query_selector(".system-header")
        if header_elem:
            await header_elem.screenshot(path=os.path.join(output_dir, "08_detalhe_header_sistema.png"))
            
        nav_elem = await page.query_selector(".master-tabs")
        if nav_elem:
            await nav_elem.screenshot(path=os.path.join(output_dir, "09_detalhe_botoes_abas.png"))
            
        quick_elem = await page.query_selector(".quick-launchers")
        if quick_elem:
            await quick_elem.screenshot(path=os.path.join(output_dir, "10_detalhe_botoes_acao_rapida.png"))

        await browser.close()
        print("All screenshots generated successfully in:", output_dir)

if __name__ == "__main__":
    asyncio.run(main())
