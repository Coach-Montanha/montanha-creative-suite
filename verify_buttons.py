import asyncio
import os
from playwright.async_api import async_playwright

async def test_buttons():
    base_dir = r"C:\Users\Administrator\Documents\Projetos\Ecossistema Montanha\Montanha Creative Suite"
    html_path = os.path.join(base_dir, "index.html")
    file_url = f"file:///{html_path.replace(os.sep, '/')}"

    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="msedge", headless=True)
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        
        await page.goto(file_url)
        await page.wait_for_timeout(500)

        # 1. Switch to AI tab
        await page.click('button[data-view="ai"]')
        await page.wait_for_timeout(500)

        # 2. Click Modifiers
        await page.click("button:has-text('/gymNewBg')")
        await page.wait_for_timeout(300)

        # 3. Click "Gerar Fotos Profissionais"
        print("Clicking #btn-generate-ai...")
        await page.click('#btn-generate-ai')
        await page.wait_for_timeout(1000)

        # Screenshot of active AI tab with generated canvases
        ai_shot = os.path.join(base_dir, "screenshots", "teste_ai_funcionando.png")
        await page.screenshot(path=ai_shot)
        print(f"Saved AI active screenshot to: {ai_shot}")

        # 4. Switch to Canvix tab
        await page.click('button[data-view="canvix"]')
        await page.wait_for_timeout(500)
        # Click element chip "Selo Oficial"
        await page.click("button:has-text('Selo Oficial')")
        await page.wait_for_timeout(400)
        canvix_shot = os.path.join(base_dir, "screenshots", "teste_canvix_funcionando.png")
        await page.screenshot(path=canvix_shot)
        print(f"Saved Canvix active screenshot to: {canvix_shot}")

        # 5. Switch to Video tab
        await page.click('button[data-view="video"]')
        await page.wait_for_timeout(500)
        await page.click('#btn-render-video')
        await page.wait_for_timeout(1000)
        video_shot = os.path.join(base_dir, "screenshots", "teste_video_funcionando.png")
        await page.screenshot(path=video_shot)
        print(f"Saved Video active screenshot to: {video_shot}")

        await browser.close()
        print("All buttons verified successfully!")

if __name__ == "__main__":
    asyncio.run(test_buttons())
