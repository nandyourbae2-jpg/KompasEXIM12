    })();
    res.status(201).json({ success: true, task_unique_number: finalTaskNumber, supplier });
  } catch (error) { console.error(error); res.status(500).json({ error: error.message }); }
});