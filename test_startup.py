import sys
sys.path.append('rmr-api')
import asyncio
from main import app, lifespan

async def test():
    async with lifespan(app):
        print('Startup completed!')

asyncio.run(test())
