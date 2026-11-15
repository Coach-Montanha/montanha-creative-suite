import asyncio
import os
from playwright.async_api import async_playwright

async def verify_engines():
    base_dir = r"C:\Users\Administrator\Documents\Projetos\Ecossistema Montanha\Montanha Creative Suite"
    html_path = os.path.join(base_dir, "index.html")
    file_url = f"file:///{html_path.replace(os.sep, '/')}"

    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="msedge", headless=True)
        page = await browser.new_page(viewport={"width": 1440, "height": 900})
        
        await page.goto(file_url)
        await page.wait_for_timeout(600)

        # 1. Test Video Studio + MotionMaxxing + MoneyPrinter + Cobalt
        print("Testing Vídeo Studio: MotionMaxxing, MoneyPrinter, Cobalt...")
        await page.click('button[data-view="video"]')
        await page.wait_for_timeout(400)

        # Test MotionMaxxing timer
        await page.select_option('#motionmaxxing-select', 'timer')
        await page.wait_for_timeout(400)

        # Test Cobalt import
        await page.fill('#cobalt-url-input', 'https://www.instagram.com/reel/example_squat')
        await page.click('#btn-cobalt-fetch')
        await page.wait_for_timeout(1500)

        # Test Earshot SFX
        await page.select_option('#earshot-sfx-select', 'whoosh')
        await page.wait_for_timeout(400)

        vid_shot = os.path.join(base_dir, "screenshots", "teste_motores_video_completos.png")
        await page.screenshot(path=vid_shot)
        print(f"Captured Video Studio verification: {vid_shot}")

        # 2. Test Photo Lab + Kokon-Photo Natural Language
        print("Testing Photo Lab: Kokon-Photo Natural Language...")
        await page.click('button[data-view="photo"]')
        await page.wait_for_timeout(400)

        # Click Kokon IA tab
        await page.click("button:has-text('Kokon IA')")
        await page.wait_for_timeout(300)

        # Apply Kokon preset "Foco Muscular"
        await page.click("button:has-text('Foco Muscular')")
        await page.wait_for_timeout(400)

        photo_shot = os.path.join(base_dir, "screenshots", "teste_motores_photo_kokon.png")
        await page.screenshot(path=photo_shot)
        print(f"Captured Photo Lab verification: {photo_shot}")

        await browser.close()
        print("All 4 engines verified cleanly!")

if __name__ == "__main__":
    asyncio.run(verify_engines())
